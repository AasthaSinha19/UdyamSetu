import React, { useState } from "react";
import { RefreshCw, ChevronRight, AlertCircle, Menu, X, Compass } from "lucide-react";

/* ---------------------------------------------------------------------
   UdyamSetu — Bridging Ideas to Successful Startups
   Design language: a civil-engineering blueprint. "Setu" = bridge,
   "Udyam" = enterprise. The idea and the startup sit on two piers;
   the app's job is to draft, girder by girder, the structure that
   connects them. Every generated plan is a set of numbered drawing
   sheets (A-01 … A-13), not a slide deck.
------------------------------------------------------------------------ */

const SHEETS = [
  { code: "A-01", key: "executiveSummary", title: "Executive Summary", kind: "prose" },
  { code: "A-02", key: "marketAnalysis", title: "Market Analysis", kind: "prose" },
  { code: "A-03", key: "competitors", title: "Competitor Analysis", kind: "competitors" },
  { code: "A-04", key: "swot", title: "SWOT Analysis", kind: "swot" },
  { code: "A-05", key: "revenueModel", title: "Revenue Model", kind: "prose" },
  { code: "A-06", key: "mvpRoadmap", title: "MVP Roadmap", kind: "roadmap" },
  { code: "A-07", key: "techStack", title: "Tech Stack Recommendation", kind: "techstack" },
  { code: "A-08", key: "marketingStrategy", title: "Marketing Strategy", kind: "prose" },
  { code: "A-09", key: "investorPitch", title: "Investor Pitch", kind: "prose" },
  { code: "A-10", key: "risks", title: "Risk Analysis", kind: "risks" },
  { code: "A-11", key: "fundingSuggestions", title: "Funding Suggestions", kind: "prose" },
  { code: "A-12", key: "businessModelCanvas", title: "Business Model Canvas", kind: "bmc" },
  { code: "A-13", key: "actionPlan", title: "30-Day Action Plan", kind: "action" },
];

const INDUSTRY_OPTIONS = [
  "FinTech", "EdTech", "HealthTech", "AgriTech", "D2C / E-commerce",
  "SaaS", "Logistics", "Climate Tech", "FoodTech", "Mobility",
];

const BUDGET_OPTIONS = [
  "Bootstrapped — Under ₹1 Lakh",
  "₹1 Lakh – ₹5 Lakh",
  "₹5 Lakh – ₹25 Lakh",
  "₹25 Lakh – ₹1 Crore",
  "Above ₹1 Crore",
];

const STAGE_OPTIONS = ["Idea Stage", "Prototype / MVP", "Early Revenue", "Growth / Scaling"];

/* Mirrors the group labels the server streams progress for
   (server/index.js owns the actual schema). Used only to render the
   loading checklist before real progress events arrive. */
const GROUP_LABELS = [
  "A-01 – A-03 · Foundations",
  "A-04 – A-06 · Strategy & Roadmap",
  "A-07 – A-09 · Execution & Pitch",
  "A-10 – A-13 · Risk & Funding",
];

/* ---------------------------- helpers ---------------------------- */

function Prose({ text }) {
  if (!text) return null;
  const blocks = String(text).split(/\n\s*\n/);
  return (
    <div className="prose-block">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isBulletBlock = lines.length > 0 && lines.every((l) => l.startsWith("-"));
        if (isBulletBlock) {
          return (
            <ul className="bp-list" key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.replace(/^-\s*/, "")}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}

function SheetShell({ code, title, subtitle, children }) {
  return (
    <div className="sheet">
      <div className="sheet-head">
        <div>
          <div className="sheet-code">{code}</div>
          <h2 className="sheet-title">{title}</h2>
          {subtitle && <div className="sheet-subtitle">{subtitle}</div>}
        </div>
        <div className="sheet-stamp">
          <div>UDYAMSETU</div>
          <div>DRG. REV. 01</div>
        </div>
      </div>
      <div className="sheet-body">{children}</div>
      <div className="sheet-foot">
        <span>SCALE — NOT TO SCALE</span>
        <span className="scalebar" aria-hidden="true" />
        <span>SHEET {code} OF A-13</span>
      </div>
    </div>
  );
}

function SwotSheet({ data }) {
  if (!data) return null;
  const quads = [
    { label: "Strengths", key: "strengths", tone: "green" },
    { label: "Weaknesses", key: "weaknesses", tone: "amber" },
    { label: "Opportunities", key: "opportunities", tone: "blue" },
    { label: "Threats", key: "threats", tone: "red" },
  ];
  return (
    <div className="swot-grid">
      {quads.map((q) => (
        <div className={`swot-cell tone-${q.tone}`} key={q.key}>
          <div className="swot-label">{q.label}</div>
          <ul className="bp-list">
            {(data[q.key] || []).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CompetitorSheet({ data }) {
  if (!data || !data.length) return null;
  return (
    <div className="table-wrap">
      <table className="bp-table">
        <thead>
          <tr>
            <th>Competitor</th>
            <th>Type</th>
            <th>Strength</th>
            <th>Weakness</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c, i) => (
            <tr key={i}>
              <td className="cell-name">{c.name}</td>
              <td>{c.type}</td>
              <td>{c.strength}</td>
              <td>{c.weakness}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoadmapSheet({ data }) {
  if (!data || !data.length) return null;
  return (
    <div className="timeline">
      {data.map((p, i) => (
        <div className="timeline-row" key={i}>
          <div className="timeline-rail">
            <span className="timeline-node">{String(i + 1).padStart(2, "0")}</span>
            {i < data.length - 1 && <span className="timeline-line" />}
          </div>
          <div className="timeline-card">
            <div className="timeline-card-head">
              <h3>{p.phase}</h3>
              <span className="chip">{p.duration}</span>
            </div>
            <ul className="bp-list">
              {(p.features || []).map((f, j) => (
                <li key={j}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function TechStackSheet({ data }) {
  if (!data) return null;
  const groups = [
    { label: "Frontend", key: "frontend" },
    { label: "Backend", key: "backend" },
    { label: "Database", key: "database" },
    { label: "Infrastructure", key: "infrastructure" },
  ];
  return (
    <div className="stack-grid">
      {groups.map((g) => (
        <div className="stack-cell" key={g.key}>
          <div className="stack-label">{g.label}</div>
          <div className="chip-row">
            {(data[g.key] || []).map((t, i) => (
              <span className="chip chip-mono" key={i}>{t}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RiskSheet({ data }) {
  if (!data || !data.length) return null;
  return (
    <div className="table-wrap">
      <table className="bp-table">
        <thead>
          <tr>
            <th>Risk</th>
            <th>Impact</th>
            <th>Mitigation</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <td className="cell-name">{r.risk}</td>
              <td><span className={`impact-tag impact-${(r.impact || "").toLowerCase()}`}>{r.impact}</span></td>
              <td>{r.mitigation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BMCSheet({ data }) {
  if (!data) return null;
  const cells = [
    { label: "Key Partners", key: "keyPartners", area: "kp" },
    { label: "Key Activities", key: "keyActivities", area: "ka" },
    { label: "Value Proposition", key: "valueProposition", area: "vp" },
    { label: "Customer Relationships", key: "customerRelationships", area: "cr" },
    { label: "Customer Segments", key: "customerSegments", area: "cs" },
    { label: "Key Resources", key: "keyResources", area: "kr" },
    { label: "Channels", key: "channels", area: "ch" },
    { label: "Cost Structure", key: "costStructure", area: "cost" },
    { label: "Revenue Streams", key: "revenueStreams", area: "rev" },
  ];
  return (
    <div className="bmc-grid">
      {cells.map((c) => (
        <div className={`bmc-cell area-${c.area}`} key={c.key}>
          <div className="bmc-label">{c.label}</div>
          <p>{data[c.key]}</p>
        </div>
      ))}
    </div>
  );
}

function ActionSheet({ data }) {
  if (!data || !data.length) return null;
  return (
    <div className="action-grid">
      {data.map((w, i) => (
        <div className="action-card" key={i}>
          <div className="action-head">
            <span className="chip chip-mono">{w.week}</span>
            <h3>{w.focus}</h3>
          </div>
          <ul className="bp-list">
            {(w.tasks || []).map((t, j) => (
              <li key={j}>{t}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- bridge SVG ---------------------------- */

function BridgeMark({ building, complete }) {
  return (
    <svg
      className={`bridge-svg ${building ? "is-building" : ""} ${complete ? "is-complete" : ""}`}
      viewBox="0 0 640 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Bridge diagram connecting Idea to Startup"
    >
      <line x1="0" y1="150" x2="640" y2="150" className="bg-line ground" />
      <rect x="30" y="60" width="40" height="90" className="pier" />
      <rect x="570" y="60" width="40" height="90" className="pier" />
      <text x="50" y="48" textAnchor="middle" className="pier-label">IDEA</text>
      <text x="590" y="48" textAnchor="middle" className="pier-label">STARTUP</text>

      <line x1="70" y1="90" x2="570" y2="90" className="deck" />
      <line x1="70" y1="96" x2="570" y2="96" className="deck deck-under" />

      {[130, 190, 250, 310, 370, 430, 490, 550].map((x, i) => (
        <line key={i} x1={x} y1="90" x2={x - 20 > 70 ? x - 20 : 70} y2="150" className="cable" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
      {[130, 190, 250, 310, 370, 430, 490, 550].map((x, i) => (
        <line key={"r" + i} x1={x} y1="90" x2={x + 20 < 570 ? x + 20 : 570} y2="150" className="cable" style={{ animationDelay: `${i * 90 + 40}ms` }} />
      ))}

      <line x1="320" y1="10" x2="320" y2="90" className="tower" />
      <circle cx="320" cy="10" r="4" className="tower-cap" />
    </svg>
  );
}

/* ---------------------------- main app ---------------------------- */

export default function App() {
  const [form, setForm] = useState({
    name: "",
    idea: "",
    industry: "",
    audience: "",
    stage: STAGE_OPTIONS[0],
    budget: BUDGET_OPTIONS[0],
  });
  const [status, setStatus] = useState("form"); // form | loading | results | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [groupDone, setGroupDone] = useState(0);
  const [groupFailed, setGroupFailed] = useState([]);
  const [navOpen, setNavOpen] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function isFormValid() {
    return form.name.trim() && form.idea.trim() && form.industry.trim() && form.audience.trim();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid()) return;
    setStatus("loading");
    setErrorMsg("");
    setGroupDone(0);
    setGroupFailed([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBase}/api/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Server responded with ${response.status}`);
      }
      if (!response.body) throw new Error("Streaming isn't supported by this connection.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "progress") {
            setGroupDone(event.done);
          } else if (event.type === "complete") {
            finished = true;
            if (Object.keys(event.data || {}).length === 0) {
              throw new Error("The drafting service couldn't produce the blueprint. Please try again.");
            }
            setResult(event.data);
            setGroupFailed(event.failed || []);
            setActiveIdx(0);
            setVisited(new Set([0]));
            setStatus("results");
          } else if (event.type === "fatal") {
            throw new Error(event.message);
          }
        }
      }

      if (!finished) throw new Error("The connection closed before the blueprint finished.");
    } catch (err) {
      if (err.name === "AbortError") {
        setErrorMsg("The request timed out after 60s. Check that the server is running and ANTHROPIC_API_KEY is set correctly.");
      } else {
        setErrorMsg(err.message || "Something broke while drafting the blueprint. Please try again.");
      }
      setStatus("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function reset() {
    setStatus("form");
    setResult(null);
    setErrorMsg("");
  }

  function selectSheet(i) {
    setActiveIdx(i);
    setVisited((v) => new Set(v).add(i));
    setNavOpen(false);
  }

  const activeSheet = SHEETS[activeIdx];

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        :root {
          --bg: #0B1E33;
          --bg-2: #102943;
          --bg-3: #14304d;
          --line: #4A7FA6;
          --line-soft: rgba(139, 183, 217, 0.16);
          --ink: #E7EEF5;
          --ink-dim: #9FB8CE;
          --amber: #F0A73C;
          --amber-soft: rgba(240, 167, 60, 0.14);
          --green: #6FCF97;
          --red: #E38080;
        }

        * { box-sizing: border-box; }
        .app-root {
          min-height: 100vh;
          background:
            linear-gradient(var(--line-soft) 1px, transparent 1px) 0 0 / 28px 28px,
            linear-gradient(90deg, var(--line-soft) 1px, transparent 1px) 0 0 / 28px 28px,
            var(--bg);
          color: var(--ink);
          font-family: 'IBM Plex Sans', sans-serif;
          padding: 28px 20px 60px;
          position: relative;
        }
        @media (prefers-reduced-motion: reduce) {
          .app-root * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }

        .topbar {
          max-width: 1180px;
          margin: 0 auto 18px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          border-bottom: 1px solid var(--line-soft);
          padding-bottom: 14px;
        }
        .wordmark {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 22px;
          letter-spacing: 0.01em;
        }
        .wordmark span { color: var(--amber); }
        .tagline {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--ink-dim);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .hero {
          max-width: 1180px;
          margin: 0 auto 30px;
        }
        .bridge-svg { width: 100%; height: auto; display: block; }
        .bg-line.ground { stroke: var(--line-soft); stroke-width: 1; }
        .pier { fill: var(--bg-3); stroke: var(--line); stroke-width: 1.5; }
        .pier-label { fill: var(--ink-dim); font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em; }
        .deck { stroke: var(--ink-dim); stroke-width: 2; }
        .deck-under { stroke: var(--line-soft); stroke-width: 1; }
        .tower { stroke: var(--ink-dim); stroke-width: 2; }
        .tower-cap { fill: var(--amber); }
        .cable {
          stroke: var(--line);
          stroke-width: 1.2;
          stroke-dasharray: 90;
          stroke-dashoffset: 0;
        }
        .bridge-svg.is-building .cable {
          stroke-dashoffset: 90;
          animation: draw-cable 700ms ease-out forwards;
        }
        .bridge-svg.is-complete .cable { stroke: var(--amber); }
        @keyframes draw-cable { to { stroke-dashoffset: 0; } }

        form.plan-form {
          max-width: 1180px;
          margin: 0 auto;
          background: var(--bg-2);
          border: 1px solid var(--line-soft);
          border-radius: 2px;
          padding: 26px;
          position: relative;
        }
        .form-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
          border-bottom: 1px dashed var(--line-soft);
          padding-bottom: 14px;
        }
        .form-head h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px;
          margin: 0 0 4px;
        }
        .form-head p { margin: 0; color: var(--ink-dim); font-size: 13.5px; max-width: 60ch; }
        .sheet-code-badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--amber);
          border: 1px solid var(--amber-soft);
          padding: 3px 9px;
          white-space: nowrap;
        }

        .field-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px 24px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field.span-2 { grid-column: 1 / -1; }
        .field label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-dim);
        }
        .field input, .field select, .field textarea {
          background: var(--bg);
          border: 1px solid var(--line-soft);
          border-radius: 2px;
          color: var(--ink);
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 14.5px;
          padding: 10px 12px;
          outline: none;
          transition: border-color 120ms ease;
        }
        .field textarea { resize: vertical; min-height: 84px; line-height: 1.5; }
        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: var(--amber);
        }
        .field select { appearance: none; cursor: pointer; }

        .form-foot {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .hint { font-size: 12.5px; color: var(--ink-dim); }

        .btn-primary {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: var(--amber);
          color: #1a1206;
          border: none;
          border-radius: 2px;
          padding: 13px 22px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 120ms ease, background 120ms ease;
        }
        .btn-primary:hover:not(:disabled) { background: #f5b458; }
        .btn-primary:active:not(:disabled) { transform: translateY(1px); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-ghost {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: transparent;
          color: var(--ink-dim);
          border: 1px solid var(--line-soft);
          border-radius: 2px;
          padding: 9px 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-ghost:hover { color: var(--ink); border-color: var(--line); }

        /* loading */
        .loading-wrap {
          max-width: 720px;
          margin: 40px auto 0;
          text-align: center;
        }
        .loading-wrap .bridge-svg { max-width: 480px; margin: 0 auto 22px; }
        .loading-step {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: var(--amber);
          min-height: 20px;
        }
        .loading-bar {
          margin: 16px auto 0;
          width: 100%;
          max-width: 420px;
          height: 3px;
          background: var(--line-soft);
          overflow: hidden;
        }
        .loading-bar-fill {
          height: 100%;
          background: var(--amber);
          transition: width 400ms ease;
        }
        .loading-groups {
          list-style: none;
          margin: 18px auto 0;
          padding: 0;
          max-width: 380px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .loading-groups li {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--ink-dim);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .loading-groups li::before {
          content: "○";
          color: var(--line-soft);
        }
        .loading-groups li.done::before { content: "●"; color: var(--green); }
        .loading-groups li.done { color: var(--ink); }
        .fail-banner {
          grid-column: 1 / -1;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--amber);
          background: var(--amber-soft);
          border: 1px solid var(--amber-soft);
          padding: 9px 14px;
          margin-bottom: 6px;
        }

        /* error */
        .error-wrap {
          max-width: 560px;
          margin: 60px auto 0;
          text-align: center;
          color: var(--ink-dim);
        }
        .error-wrap svg { color: var(--red); margin-bottom: 10px; }

        /* results layout */
        .results-shell {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 22px;
          align-items: start;
        }
        .results-head {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line-soft);
          padding-bottom: 14px;
          margin-bottom: 4px;
        }
        .project-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 19px;
        }
        .project-meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--ink-dim);
        }
        .nav-toggle { display: none; }

        .sheet-nav {
          background: var(--bg-2);
          border: 1px solid var(--line-soft);
          padding: 10px;
          position: sticky;
          top: 20px;
        }
        .sheet-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: transparent;
          border: none;
          color: var(--ink-dim);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          text-align: left;
          padding: 9px 8px;
          cursor: pointer;
          border-radius: 2px;
        }
        .sheet-nav-item .code { color: var(--ink-dim); width: 34px; flex-shrink: 0; }
        .sheet-nav-item .dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--line-soft); flex-shrink: 0;
        }
        .sheet-nav-item.visited .dot { background: var(--green); }
        .sheet-nav-item .label { font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; }
        .sheet-nav-item:hover { background: var(--bg-3); color: var(--ink); }
        .sheet-nav-item.active {
          background: var(--amber-soft);
          color: var(--ink);
        }
        .sheet-nav-item.active .code { color: var(--amber); }

        .sheet {
          background: var(--bg-2);
          border: 1px solid var(--line-soft);
          min-height: 420px;
          display: flex;
          flex-direction: column;
        }
        .sheet-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 22px 26px;
          border-bottom: 1px dashed var(--line-soft);
        }
        .sheet-code {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--amber);
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .sheet-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 21px;
          margin: 0;
        }
        .sheet-subtitle { color: var(--ink-dim); font-size: 12.5px; margin-top: 4px; }
        .sheet-stamp {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9.5px;
          color: var(--ink-dim);
          text-align: right;
          border: 1px solid var(--line-soft);
          padding: 6px 9px;
          line-height: 1.6;
          letter-spacing: 0.05em;
        }
        .sheet-body { padding: 24px 26px; flex: 1; }
        .sheet-foot {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 26px;
          border-top: 1px dashed var(--line-soft);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--ink-dim);
          letter-spacing: 0.06em;
        }
        .scalebar { flex: 1; height: 1px; background: repeating-linear-gradient(90deg, var(--ink-dim) 0 8px, transparent 8px 16px); }

        .prose-block p { line-height: 1.7; margin: 0 0 14px; color: var(--ink); font-size: 14.5px; }
        .prose-block p:last-child { margin-bottom: 0; }
        .bp-list { margin: 0 0 14px; padding-left: 18px; color: var(--ink); font-size: 14.5px; line-height: 1.6; }
        .bp-list li { margin-bottom: 6px; }
        .bp-list:last-child { margin-bottom: 0; }

        .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .swot-cell { border: 1px solid var(--line-soft); padding: 16px; }
        .swot-cell .bp-list { margin-bottom: 0; }
        .swot-label { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
        .tone-green .swot-label { color: var(--green); }
        .tone-amber .swot-label { color: var(--amber); }
        .tone-blue .swot-label { color: #7FB3E0; }
        .tone-red .swot-label { color: var(--red); }

        .table-wrap { overflow-x: auto; }
        .bp-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .bp-table th {
          text-align: left; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
          text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-dim);
          border-bottom: 1px solid var(--line-soft); padding: 8px 10px;
        }
        .bp-table td { padding: 11px 10px; border-bottom: 1px solid var(--line-soft); vertical-align: top; line-height: 1.5; }
        .cell-name { font-weight: 600; white-space: nowrap; }

        .impact-tag { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; padding: 2px 8px; border: 1px solid; }
        .impact-high { color: var(--red); border-color: var(--red); }
        .impact-medium { color: var(--amber); border-color: var(--amber); }
        .impact-low { color: var(--green); border-color: var(--green); }

        .timeline { display: flex; flex-direction: column; }
        .timeline-row { display: flex; gap: 16px; }
        .timeline-rail { display: flex; flex-direction: column; align-items: center; }
        .timeline-node {
          width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--amber);
          color: var(--amber); font-family: 'IBM Plex Mono', monospace; font-size: 11px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .timeline-line { flex: 1; width: 1px; background: var(--line-soft); min-height: 20px; }
        .timeline-card { padding-bottom: 22px; flex: 1; }
        .timeline-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .timeline-card-head h3 { font-family: 'Space Grotesk', sans-serif; font-size: 15.5px; margin: 0; }

        .chip {
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: var(--ink-dim);
          border: 1px solid var(--line-soft); padding: 2px 8px; white-space: nowrap;
        }
        .chip-mono { color: var(--amber); border-color: var(--amber-soft); }
        .chip-row { display: flex; flex-wrap: wrap; gap: 7px; }

        .stack-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .stack-cell { border: 1px solid var(--line-soft); padding: 14px 16px; }
        .stack-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-dim); margin-bottom: 10px; }

        .bmc-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-template-areas:
            "kp ka vp cr cs"
            "kp kr vp ch cs"
            "cost cost rev rev rev";
          gap: 10px;
        }
        .bmc-cell { border: 1px solid var(--line-soft); padding: 12px; font-size: 12.5px; line-height: 1.5; }
        .bmc-cell p { margin: 0; color: var(--ink-dim); }
        .bmc-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--amber); margin-bottom: 6px; }
        .area-kp { grid-area: kp; } .area-ka { grid-area: ka; } .area-vp { grid-area: vp; }
        .area-cr { grid-area: cr; } .area-cs { grid-area: cs; } .area-kr { grid-area: kr; }
        .area-ch { grid-area: ch; } .area-cost { grid-area: cost; } .area-rev { grid-area: rev; }

        .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .action-card { border: 1px solid var(--line-soft); padding: 16px; }
        .action-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .action-head h3 { font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; margin: 0; }

        @media (max-width: 860px) {
          .field-grid { grid-template-columns: 1fr; }
          .results-shell { grid-template-columns: 1fr; }
          .sheet-nav {
            position: fixed; inset: 0 0 0 auto; width: 78vw; max-width: 300px;
            z-index: 40; overflow-y: auto; transform: translateX(100%);
            transition: transform 200ms ease;
          }
          .sheet-nav.open { transform: translateX(0); }
          .nav-toggle { display: inline-flex; }
          .swot-grid, .stack-grid, .action-grid { grid-template-columns: 1fr; }
          .bmc-grid { grid-template-columns: 1fr 1fr; grid-template-areas:
            "kp ka" "vp vp" "cr cs" "kr ch" "cost rev"; }
        }
      `}</style>

      <div className="topbar">
        <div>
          <div className="wordmark">Udyam<span>Setu</span></div>
          <div className="tagline">Bridging Ideas to Successful Startups</div>
        </div>
        {status === "results" && (
          <button className="btn-ghost" onClick={reset}>
            <RefreshCw size={13} /> New Blueprint
          </button>
        )}
      </div>

      {status === "form" && (
        <>
          <div className="hero">
            <BridgeMark />
          </div>

          <form className="plan-form" onSubmit={handleSubmit}>
            <div className="form-head">
              <div>
                <h1>Sheet A-00 — Project Brief</h1>
                <p>Specify the venture. UdyamSetu drafts thirteen numbered sheets — from executive summary through a 30-day action plan — sized to your stage and budget.</p>
              </div>
              <span className="sheet-code-badge">A-00 / BRIEF</span>
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="f-name">Startup Name</label>
                <input id="f-name" type="text" placeholder="e.g. Kisan Konnect" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="f-industry">Industry</label>
                <input id="f-industry" list="industry-list" type="text" placeholder="e.g. AgriTech" value={form.industry} onChange={(e) => update("industry", e.target.value)} required />
                <datalist id="industry-list">
                  {INDUSTRY_OPTIONS.map((o) => <option value={o} key={o} />)}
                </datalist>
              </div>

              <div className="field span-2">
                <label htmlFor="f-idea">Startup Idea</label>
                <textarea id="f-idea" placeholder="Describe the problem you're solving and how, in a few sentences." value={form.idea} onChange={(e) => update("idea", e.target.value)} required />
              </div>

              <div className="field">
                <label htmlFor="f-audience">Target Audience</label>
                <input id="f-audience" type="text" placeholder="e.g. Small-holder farmers in Tier-2/3 India" value={form.audience} onChange={(e) => update("audience", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="f-stage">Business Stage</label>
                <select id="f-stage" value={form.stage} onChange={(e) => update("stage", e.target.value)}>
                  {STAGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="field span-2">
                <label htmlFor="f-budget">Budget</label>
                <select id="f-budget" value={form.budget} onChange={(e) => update("budget", e.target.value)}>
                  {BUDGET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="form-foot">
              <span className="hint">All thirteen sheets are drafted from these six inputs — the more specific the idea, the sharper the blueprint.</span>
              <button className="btn-primary" type="submit" disabled={!isFormValid()}>
                <Compass size={15} /> Generate Blueprint
              </button>
            </div>
          </form>
        </>
      )}

      {status === "loading" && (
        <div className="loading-wrap">
          <BridgeMark building />
          <div className="loading-step">Drafting the blueprint — {groupDone} of {GROUP_LABELS.length} sheet groups back</div>
          <div className="loading-bar">
            <div className="loading-bar-fill" style={{ width: `${(groupDone / GROUP_LABELS.length) * 100}%` }} />
          </div>
          <ul className="loading-groups">
            {GROUP_LABELS.map((label, i) => (
              <li key={label} className={i < groupDone ? "done" : ""}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {status === "error" && (
        <div className="error-wrap">
          <AlertCircle size={28} />
          <p>{errorMsg}</p>
          <button className="btn-primary" onClick={reset}><RefreshCw size={14} /> Try Again</button>
        </div>
      )}

      {status === "results" && result && (
        <div className="results-shell">
          {groupFailed.length > 0 && (
            <div className="fail-banner">
              Couldn't draft: {groupFailed.join(", ")}. <button className="btn-ghost" style={{ padding: "4px 10px", marginLeft: 8 }} onClick={handleSubmit}>Retry</button>
            </div>
          )}
          <div className="results-head">
            <div>
              <div className="project-name">{form.name}</div>
              <div className="project-meta">{form.industry.toUpperCase()} · {form.stage.toUpperCase()} · {form.budget.toUpperCase()}</div>
            </div>
            <button className="btn-ghost nav-toggle" onClick={() => setNavOpen((v) => !v)}>
              {navOpen ? <X size={14} /> : <Menu size={14} />} Sheets
            </button>
          </div>

          <nav className={`sheet-nav ${navOpen ? "open" : ""}`}>
            {SHEETS.map((s, i) => (
              <button
                key={s.code}
                className={`sheet-nav-item ${i === activeIdx ? "active" : ""} ${visited.has(i) ? "visited" : ""}`}
                onClick={() => selectSheet(i)}
              >
                <span className="dot" />
                <span className="code">{s.code}</span>
                <span className="label">{s.title}</span>
                {i === activeIdx && <ChevronRight size={13} style={{ marginLeft: "auto" }} />}
              </button>
            ))}
          </nav>

          <SheetShell code={activeSheet.code} title={activeSheet.title}>
            {activeSheet.kind === "prose" && <Prose text={result[activeSheet.key]} />}
            {activeSheet.kind === "competitors" && <CompetitorSheet data={result.competitors} />}
            {activeSheet.kind === "swot" && <SwotSheet data={result.swot} />}
            {activeSheet.kind === "roadmap" && <RoadmapSheet data={result.mvpRoadmap} />}
            {activeSheet.kind === "techstack" && <TechStackSheet data={result.techStack} />}
            {activeSheet.kind === "risks" && <RiskSheet data={result.risks} />}
            {activeSheet.kind === "bmc" && <BMCSheet data={result.businessModelCanvas} />}
            {activeSheet.kind === "action" && <ActionSheet data={result.actionPlan} />}
          </SheetShell>
        </div>
      )}
    </div>
  );
}
