# UdyamSetu — Bridging Ideas to Successful Startups

A full-stack AI web app, deployed as a **single Vercel project**:

```
udyamsetu/
├── frontend/     React (Vite) — the form + 13-sheet blueprint UI
├── api/          Vercel serverless functions — hold your Gemini API key, call Gemini
└── vercel.json   Tells Vercel how to build the frontend and mount the api/ functions
```

Takes Startup Name, Startup Idea, Industry, Target Audience, Business
Stage, and Budget, and generates: Executive Summary, Market Analysis,
Competitor Analysis, SWOT Analysis, Revenue Model, MVP Roadmap, Tech
Stack Recommendation, Marketing Strategy, Investor Pitch, Risk
Analysis, Funding Suggestions, Business Model Canvas Summary, and a
30-Day Action Plan.

## How the pieces talk to each other

- `frontend/` calls `/api/generate-plan` — same-origin, since both live
  in the same Vercel project. `frontend/.env` can stay empty.
- `api/generate-plan.js` reads `GEMINI_API_KEY` from the environment
  and calls Google's Gemini API (`gemini-3.5-flash`) four times in
  parallel, streaming per-group progress back to the UI.
- The key never reaches the browser — only the serverless function
  reads it.

## Deploying to Vercel

**1. Push this project to GitHub** (see steps below if you haven't yet).

**2. Import into Vercel**
- Go to [vercel.com](https://vercel.com) → **Add New → Project** →
  import your GitHub repo.
- Vercel will detect `vercel.json` and use it automatically — you
  don't need to change the Framework Preset, Build Command, or Output
  Directory in the UI.

**3. Add your environment variable**
- In the import screen (or later under **Project Settings →
  Environment Variables**), add:
  - **Name:** `GEMINI_API_KEY`
  - **Value:** your real key from https://aistudio.google.com/apikey
  - **Environments:** Production, Preview, and Development (check all three)

**4. Deploy**
- Click **Deploy**. Vercel builds the frontend and picks up the
  `api/` functions automatically.
- You'll get a live URL like `https://udyamsetu.vercel.app`.

**5. Test it**
- Open the live URL, fill in the form, click **Generate Blueprint**.
- If it fails, check **Vercel Dashboard → your project → Deployments →
  (latest) → Functions** for the `generate-plan` function's logs —
  this is where "missing GEMINI_API_KEY" or Gemini API errors show up.

## Running locally

You need [Node.js](https://nodejs.org) v18+ and the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Run this from the project root (not inside `frontend/`). `vercel dev`
serves the Vite frontend **and** the `api/` functions together on one
local port, matching production. Add your real key to a `.env` file
at the project root first:

```
GEMINI_API_KEY=your-real-key-here
```

## Project structure

```
frontend/
  src/App.jsx        Form + results UI (all 13 sheets)
  src/main.jsx        React entry point
  index.html
  vite.config.js       Build config
  public/               favicon, robots.txt
  .env / .env.example   VITE_API_BASE_URL (leave empty)

api/
  generate-plan.js     Calls Gemini, streams ndjson progress events
  health.js             GET /api/health — confirms the key is set

vercel.json             Build + function config for the whole project
```

## Troubleshooting

- **"Server is missing GEMINI_API_KEY"** — add it under Vercel
  Project Settings → Environment Variables, then redeploy (env var
  changes need a fresh deploy to take effect).
- **Generate Blueprint times out** — `vercel.json` sets `maxDuration:
  60` for `generate-plan.js`; on the free Hobby plan that's the
  ceiling. If Gemini itself is slow, consider switching to a faster
  model in `api/generate-plan.js`.
- **Works locally but not deployed** — double-check the env var name
  matches exactly (`GEMINI_API_KEY`) and is enabled for the
  Production environment, not just Development.
