// Vercel Serverless Function
// POST /api/generate-plan
// Uses ONE Gemini request instead of four parallel requests.

export const config = {
  maxDuration: 60,
};

const GEMINI_MODEL = "gemini-3.5-flash";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const MAX_ATTEMPTS = 3;

const BLUEPRINT_SCHEMA = `
{
  "executiveSummary": "string",
  "marketAnalysis": "string",

  "competitors": [
    {
      "name": "string",
      "type": "Direct | Indirect",
      "strength": "string",
      "weakness": "string"
    }
  ],

  "swot": {
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": []
  },

  "revenueModel": "string",

  "mvpRoadmap": [
    {
      "phase": "string",
      "duration": "string",
      "features": []
    }
  ],

  "techStack": {
    "frontend": [],
    "backend": [],
    "database": [],
    "infrastructure": []
  },

  "marketingStrategy": "string",

  "investorPitch": "string",

  "risks": [
    {
      "risk": "string",
      "impact": "High | Medium | Low",
      "mitigation": "string"
    }
  ],

  "fundingSuggestions": "string",

  "businessModelCanvas": {
    "keyPartners": "",
    "keyActivities": "",
    "keyResources": "",
    "valueProposition": "",
    "customerRelationships": "",
    "channels": "",
    "customerSegments": "",
    "costStructure": "",
    "revenueStreams": ""
  },

  "actionPlan": [
    {
      "week": "Week 1",
      "focus": "",
      "tasks": []
    }
  ]
}
`;

function buildPrompt(form) {
  return `
You are an experienced Startup Consultant.

Generate a COMPLETE startup blueprint.

Return ONLY VALID JSON.

No markdown.
No explanation.
No code fences.

Use this exact schema:

${BLUEPRINT_SCHEMA}

Startup Name:
${form.name}

Startup Idea:
${form.idea}

Industry:
${form.industry}

Target Audience:
${form.audience}

Business Stage:
${form.stage}

Budget:
${form.budget}

Requirements:

- Make everything highly specific.
- Never use placeholders.
- Use INR (₹) wherever money is mentioned.
- SWOT should have 4-5 points each.
- Competitors should contain 4 companies.
- MVP roadmap should contain 4 phases.
- Risks should contain 5 items.
- Action plan should contain exactly 4 weeks.
- Marketing strategy should be practical.
- Revenue model should include realistic pricing.
- Investor pitch should be convincing.
`;
}

function validateForm(form) {
  if (!form || typeof form !== "object")
    return "Missing form data.";

  const required = [
    "name",
    "idea",
    "industry",
    "audience",
    "stage",
    "budget",
  ];

  for (const field of required) {
    if (!form[field] || !String(form[field]).trim())
      return `Missing field: ${field}`;
  }

  return null;
}
async function callGemini(form, apiKey) {
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildPrompt(form),
          },
        ],
      },
    ],

    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();

        const error = new Error(
          `Gemini API ${response.status}: ${text.slice(0, 300)}`
        );

        error.status = response.status;

        throw error;
      }

      const json = await response.json();

      const text =
        json?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("\n") || "";

      if (!text.trim()) {
        throw new Error("Gemini returned an empty response.");
      }

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");

      if (start === -1 || end === -1) {
        throw new Error("Gemini did not return valid JSON.");
      }

      const parsed = JSON.parse(
        cleaned.substring(start, end + 1)
      );

      return parsed;
    } catch (err) {
      lastError = err;

      const retryable =
        RETRYABLE_STATUS.has(err.status) ||
        err.name === "AbortError";

      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw err;
      }

      const delay =
        1000 * Math.pow(2, attempt - 1) +
        Math.floor(Math.random() * 500);

      await sleep(delay);
    }
  }

  throw lastError;
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method not allowed",
    });
    return;
  }

  const validationError = validateForm(req.body);

  if (validationError) {
    res.status(400).json({
      error: validationError,
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: "Server is missing GEMINI_API_KEY.",
    });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const write = (obj) => {
    res.write(JSON.stringify(obj) + "\n");
  };

  try {
    // Fake progress so the frontend UI still animates
    write({
      type: "progress",
      label: "Analyzing startup idea...",
      done: 1,
      total: 4,
    });

    await sleep(300);

    write({
      type: "progress",
      label: "Generating business strategy...",
      done: 2,
      total: 4,
    });

    await sleep(300);

    write({
      type: "progress",
      label: "Preparing financials & roadmap...",
      done: 3,
      total: 4,
    });

    // Single Gemini request
    const blueprint = await callGemini(req.body, apiKey);

    write({
      type: "progress",
      label: "Finalizing startup blueprint...",
      done: 4,
      total: 4,
    });

    write({
      type: "complete",
      data: blueprint,
      failed: [],
    });

  } catch (err) {

    console.error(err);

    write({
      type: "fatal",
      message:
        err.message ||
        "Failed to generate startup blueprint.",
    });

  } finally {
    res.end();
  }
}
