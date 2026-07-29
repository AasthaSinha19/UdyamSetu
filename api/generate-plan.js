// Vercel serverless function — POST /api/generate-plan
// Calls Google Gemini (not Anthropic) to draft the startup blueprint.
// Requires env var GEMINI_API_KEY, set in Vercel Project Settings.

export const config = {
  maxDuration: 60, // allow up to 60s (Hobby plan ceiling) for the 4 parallel Gemini calls
};

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/* Same four-group split used on the client, kept here as the single
   source of truth. Splitting the ask keeps each completion small and
   lets the client show real per-group progress instead of a spinner. */
const GROUP_DEFS = [
  {
    label: "A-01 – A-03 · Foundations",
    schema: `{"executiveSummary": "string, 3-4 short paragraphs separated by a blank line", "marketAnalysis": "string, 2-3 short paragraphs, may include lines starting with '- ' for key stats", "competitors": [ {"name": "string", "type": "Direct or Indirect", "strength": "string", "weakness": "string"} ] (3 to 4 items)}`,
  },
  {
    label: "A-04 – A-06 · Strategy & Roadmap",
    schema: `{"swot": {"strengths": ["string", "..."], "weaknesses": ["string", "..."], "opportunities": ["string", "..."], "threats": ["string", "..."]} (3 to 5 bullets each), "revenueModel": "string, paragraphs and '- ' bullet lines for concrete revenue streams", "mvpRoadmap": [ {"phase": "string", "duration": "string", "features": ["string", "..."]} ] (3 to 5 phases)}`,
  },
  {
    label: "A-07 – A-09 · Execution & Pitch",
    schema: `{"techStack": {"frontend": ["string", "..."], "backend": ["string", "..."], "database": ["string", "..."], "infrastructure": ["string", "..."]}, "marketingStrategy": "string, paragraphs and '- ' bullets, channel-specific and budget-appropriate", "investorPitch": "string, paragraphs covering hook, problem, solution, market size, traction plan, and the ask"}`,
  },
  {
    label: "A-10 – A-13 · Risk & Funding",
    schema: `{"risks": [ {"risk": "string", "impact": "High, Medium or Low", "mitigation": "string"} ] (4 to 5 items), "fundingSuggestions": "string, paragraphs and '- ' bullets naming concrete funding routes fitting the stage and budget", "businessModelCanvas": {"keyPartners":"string","keyActivities":"string","keyResources":"string","valueProposition":"string","customerRelationships":"string","channels":"string","customerSegments":"string","costStructure":"string","revenueStreams":"string"}, "actionPlan": [ {"week": "Week 1", "focus": "string", "tasks": ["string", "..."]} ] (exactly 4 items covering 30 days)}`,
  },
];

function buildUserPrompt(form) {
  return `Startup Name: ${form.name}
Startup Idea: ${form.idea}
Industry: ${form.industry}
Target Audience: ${form.audience}
Business Stage: ${form.stage}
Budget: ${form.budget}

Draft this part of the startup blueprint for this venture. Ground it in the specific details above. Use ₹ (INR) figures where money is mentioned, sized to the stated budget band. Be concrete and specific, never generic filler.`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini returns 503 when the model is overloaded and 429 on rate limits —
// both are transient, so retry with exponential backoff before giving up.
const RETRYABLE_STATUS = new Set([429, 503]);
const MAX_ATTEMPTS = 4;

async function callGeminiOnce(group, form, apiKey) {
  const systemPrompt = `Return ONLY valid JSON (no markdown fences, no commentary, no leading or trailing text) matching exactly this shape:\n${group.schema}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(form) }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err = new Error(`${group.label} — Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const textBlock = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("\n");

  const cleaned = textBlock.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`${group.label} — response wasn't JSON`);
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callGroup(group, form, apiKey) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGeminiOnce(group, form, apiKey);
    } catch (err) {
      lastErr = err;
      const retryable = RETRYABLE_STATUS.has(err.status);
      if (!retryable || attempt === MAX_ATTEMPTS) throw err;
      // exponential backoff with jitter: ~600ms, ~1.2s, ~2.4s
      const delay = 600 * 2 ** (attempt - 1) + Math.random() * 300;
      await sleep(delay);
    }
  }
  throw lastErr;
}

function validateForm(form) {
  if (!form || typeof form !== "object") return "Missing form data.";
  const required = ["name", "idea", "industry", "audience", "stage", "budget"];
  for (const field of required) {
    if (!form[field] || !String(form[field]).trim()) return `Missing field: ${field}`;
  }
  return null;
}

/* Streams newline-delimited JSON events so the UI can show real,
   per-group progress instead of a spinner:
     {"type":"progress","label":"...","done":1,"total":4}
     {"type":"group-error","label":"...","message":"..."}
     {"type":"complete","data":{...}, "failed":["..."]}
     {"type":"fatal","message":"..."} */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const validationError = validateForm(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const merged = {};
  const failed = [];
  let done = 0;

  const write = (obj) => res.write(JSON.stringify(obj) + "\n");

  try {
    await Promise.all(
      GROUP_DEFS.map(async (group) => {
        try {
          const parsed = await callGroup(group, req.body, apiKey);
          Object.assign(merged, parsed);
        } catch (err) {
          failed.push(group.label);
          write({ type: "group-error", label: group.label, message: err.message });
        } finally {
          done += 1;
          write({ type: "progress", label: group.label, done, total: GROUP_DEFS.length });
        }
      })
    );

    write({ type: "complete", data: merged, failed });
  } catch (err) {
    write({ type: "fatal", message: err.message || "Unexpected server error." });
  } finally {
    res.end();
  }
}
