import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DB_PATH || path.join(__dirname, "db.json");
const app = express();
const port = process.env.PORT || 3000;
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const rateWindowMs = 60 * 1000;
const rateLimitMax = 12;
const requestBuckets = new Map();
let writeQueue = Promise.resolve();

app.use(express.json({ limit: "3mb" }));
app.use(express.static(__dirname));

function bucketKey(req) {
  return req.ip || req.socket.remoteAddress || "local";
}

function rateLimit(req, res, next) {
  const now = Date.now();
  const key = bucketKey(req);
  const recent = (requestBuckets.get(key) || []).filter((time) => now - time < rateWindowMs);
  if (recent.length >= rateLimitMax) {
    res.status(429).json({ ok: false, error: "Rate limit exceeded. Try again shortly." });
    return;
  }
  recent.push(now);
  requestBuckets.set(key, recent);
  next();
}

function sanitizeText(value, limit) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, limit);
}

function normalizeEmail(value) {
  return sanitizeText(value, 160).toLowerCase();
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) {
    return false;
  }
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

async function ensureDb() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  try {
    await fs.access(dbPath);
  } catch (_error) {
    const seed = {
      users: [],
      sessions: [],
      workspaces: []
    };
    await fs.writeFile(dbPath, JSON.stringify(seed, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw);
}

async function writeDb(nextDb) {
  writeQueue = writeQueue.then(() => fs.writeFile(dbPath, JSON.stringify(nextDb, null, 2)));
  await writeQueue;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    createdAt: user.createdAt
  };
}

async function authUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return null;
  }
  const db = await readDb();
  const session = db.sessions.find((item) => item.token === token && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) {
    return null;
  }
  const user = db.users.find((item) => item.id === session.userId);
  if (!user) {
    return null;
  }
  return { db, token, session, user };
}

async function requireAuth(req, res, next) {
  const auth = await authUser(req);
  if (!auth) {
    res.status(401).json({ ok: false, error: "Authentication required." });
    return;
  }
  req.auth = auth;
  next();
}

function fallbackFor(mode, source) {
  const sourceName = sanitizeText(source || "AI Governance Framework", 120);
  const summaries = {
    Beginner: [
      { label: "Purpose", text: "Turns long-form source material into structured, visual, and role-friendly outputs." },
      { label: "Key Takeaway", text: "The platform should preserve traceability while simplifying review and comprehension." },
      { label: "Implication", text: "Users get summaries, cheat notes, flashcards, charts, and follow-up study guidance from one workflow." }
    ],
    Exam: [
      { label: "Purpose", text: "Organizes the source into testable concepts, key checkpoints, and likely recall prompts." },
      { label: "Key Takeaway", text: "Review should focus on connecting concepts, controls, and scenario responses." },
      { label: "Implication", text: "Learners need stronger repetition around weak topics and source-linked evidence." }
    ],
    Advanced: [
      { label: "Purpose", text: "Reframes the source into a decision system for leaders, trainers, and operating teams." },
      { label: "Key Takeaway", text: "Knowledge assets become more useful when they are visual, role-aware, and exportable." },
      { label: "Implication", text: "The platform should support governance, onboarding, compliance, and L&D analytics with shared evidence." }
    ]
  };

  return {
    depth: mode.toLowerCase(),
    summary: summaries[mode] || summaries.Beginner,
    cheat: [
      "Keep outputs linked to source excerpts and citations.",
      "Generate multiple learning formats from a single upload.",
      "Highlight weak areas and suggest the next study action.",
      "Design for both individual learners and team operations."
    ],
    graph: {
      core: sourceName,
      nodes: ["Concept Extraction", "Traceability", "Visual Assets", "Review", "Recommendations", "Export"]
    },
    charts: [
      { label: "Core Concepts", value: 82 },
      { label: "Retention", value: 69 },
      { label: "Risk Coverage", value: 58 },
      { label: "Decision Readiness", value: 77 },
      { label: "Source Confidence", value: 88 }
    ],
    timeline: [
      { step: "Capture", detail: "Upload or link content with validation and metadata." },
      { step: "Transform", detail: "Extract concepts, structure themes, and build learning assets." },
      { step: "Visualize", detail: "Render charts, map nodes, cheat notes, and flashcards." },
      { step: "Review", detail: "Track weak topics and suggest next study actions." }
    ],
    flashcards: [
      {
        question: "What makes a knowledge operations platform different from a summary tool?",
        answer: "It transforms content into multiple structured, reusable, and decision-ready assets."
      },
      {
        question: "Why does traceability matter in generated study assets?",
        answer: "It helps users verify where an insight came from and whether it is trustworthy."
      },
      {
        question: "What is the value of multiple output modes?",
        answer: "Different roles learn faster from different formats such as summaries, charts, notes, and quizzes."
      }
    ],
    review: [
      { label: "Weak Topic", title: "Decision Readiness", body: "44%" },
      { label: "Weak Topic", title: "Evidence Mapping", body: "57%" },
      { label: "Weak Topic", title: "Risk Coverage", body: "63%" }
    ],
    recommendations: [
      "Revisit the source sections behind low-confidence insights.",
      "Switch to advanced mode for role-specific operational implications.",
      "Export the workspace to markdown for distribution or review."
    ],
    citations: [
      { title: "Source overview", note: "The uploaded content establishes the central operating context.", source: "Excerpt 1" },
      { title: "Key evidence", note: "A reliable summary should keep the strongest supporting excerpt attached.", source: "Excerpt 2" },
      { title: "Applied implication", note: "Decision-ready assets should explain what action the user can take next.", source: "Excerpt 3" }
    ],
    quiz: [
      {
        prompt: "Which capability creates business-grade value beyond basic summarization?",
        options: ["Visual learning artifacts", "Longer paragraphs", "Fewer outputs"],
        answer: "Visual learning artifacts"
      },
      {
        prompt: "What should a secure upload flow do first?",
        options: ["Skip validation", "Validate source type and metadata", "Expose keys in the client"],
        answer: "Validate source type and metadata"
      }
    ],
    stats: {
      savedHours: 220,
      comprehension: 76,
      sourcesProcessed: 1248,
      assetsCreated: 3674
    }
  };
}

function buildPrompt(body) {
  const mode = sanitizeText(body.mode || "Beginner", 24);
  const audience = sanitizeText(body.audience || "L&D Leader", 80);
  const source = sanitizeText(body.source || "uploaded source", 120);
  const sourceType = sanitizeText(body.sourceType || "Document", 40);
  const sourceUrl = sanitizeText(body.sourceUrl || "Not provided", 240);
  const content = sanitizeText(body.content || "", 14000);

  return `You are generating structured outputs for AtlasIQ Ops, an AI-powered visual knowledge transformation platform.
Return valid JSON only in this exact shape:
{
  "depth": "beginner",
  "summary": [{"label":"Purpose","text":"..."},{"label":"Key Takeaway","text":"..."},{"label":"Implication","text":"..."}],
  "cheat": ["...", "...", "...", "..."],
  "graph": {"core":"...","nodes":["...","...","...","...","...","..."]},
  "charts": [{"label":"...","value":84},{"label":"...","value":71},{"label":"...","value":56},{"label":"...","value":79},{"label":"...","value":61}],
  "timeline": [{"step":"...","detail":"..."},{"step":"...","detail":"..."},{"step":"...","detail":"..."},{"step":"...","detail":"..."}],
  "flashcards": [{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."}],
  "review": [{"label":"Weak Topic","title":"...","body":"42%"}],
  "recommendations": ["...", "...", "..."],
  "citations": [{"title":"...","note":"...","source":"Excerpt 1"},{"title":"...","note":"...","source":"Excerpt 2"},{"title":"...","note":"...","source":"Excerpt 3"}],
  "quiz": [{"prompt":"...","options":["...","...","..."],"answer":"..."}],
  "stats": {"savedHours":220,"comprehension":76,"sourcesProcessed":1248,"assetsCreated":3674}
}
Make the response professional, source-grounded, concise, and role-friendly.
Mode: ${mode}
Audience: ${audience}
Source: ${source}
Source Type: ${sourceType}
Source URL: ${sourceUrl}
Source Content:
${content}`;
}

async function generateInsights(body) {
  const mode = sanitizeText(body.mode || "Beginner", 24);
  const source = sanitizeText(body.source || "Uploaded Source", 120);
  if (!process.env.OPENAI_API_KEY) {
    return fallbackFor(mode, source);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: buildPrompt(body) }] },
        { role: "user", content: [{ type: "input_text", text: `Generate ${mode} knowledge assets.` }] }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data.output_text || "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model response did not contain JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

app.post("/api/auth/register", rateLimit, async (req, res) => {
  const name = sanitizeText(req.body?.name || "", 120);
  const email = normalizeEmail(req.body?.email || "");
  const password = sanitizeText(req.body?.password || "", 200);
  const role = sanitizeText(req.body?.role || "Learner", 60);
  const team = sanitizeText(req.body?.team || "", 80);

  if (!name || !email || password.length < 8) {
    res.status(400).json({ ok: false, error: "Name, email, and a password of at least 8 characters are required." });
    return;
  }

  const db = await readDb();
  if (db.users.some((item) => item.email === email)) {
    res.status(409).json({ ok: false, error: "An account already exists for that email." });
    return;
  }

  const user = {
    id: createId("user"),
    name,
    email,
    passwordHash: hashPassword(password),
    role,
    team,
    createdAt: new Date().toISOString()
  };

  const token = crypto.randomBytes(32).toString("hex");
  const session = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
  };

  db.users.push(user);
  db.sessions.push(session);
  await writeDb(db);

  res.json({ ok: true, token, user: publicUser(user) });
});

app.post("/api/auth/login", rateLimit, async (req, res) => {
  const email = normalizeEmail(req.body?.email || "");
  const password = sanitizeText(req.body?.password || "", 200);
  const db = await readDb();
  const user = db.users.find((item) => item.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ ok: false, error: "Invalid email or password." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  db.sessions = db.sessions.filter((item) => item.userId !== user.id);
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
  });
  await writeDb(db);

  res.json({ ok: true, token, user: publicUser(user) });
});

app.get("/api/auth/session", requireAuth, async (req, res) => {
  res.json({ ok: true, user: publicUser(req.auth.user) });
});

app.post("/api/auth/logout", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.json({ ok: true });
    return;
  }
  const db = await readDb();
  db.sessions = db.sessions.filter((item) => item.token !== token);
  await writeDb(db);
  res.json({ ok: true });
});

app.get("/api/workspaces", requireAuth, async (req, res) => {
  const db = req.auth.db;
  const seedTitle = "AI Governance Framework";
  const hasSeed = db.workspaces.some((item) => item.userId === req.auth.user.id && item.title === seedTitle);
  if (!hasSeed) {
    db.workspaces.push({
      id: createId("workspace"),
      userId: req.auth.user.id,
      title: seedTitle,
      sourceType: "PDF",
      sourceUrl: "https://example.com/ai-governance-framework",
      sourceContent:
        "This source establishes principles and operational guidelines for responsible AI adoption across the organization. Key themes include compliance, data privacy, human oversight, transparency, model risk management, and escalation paths for high-risk use cases.",
      mode: "Beginner",
      savedAt: new Date().toISOString(),
      outputs: fallbackFor("Beginner", seedTitle)
    });
    await writeDb(db);
  }

  const workspaces = db.workspaces
    .filter((item) => item.userId === req.auth.user.id)
    .sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime());
  res.json({ ok: true, workspaces });
});

app.post("/api/workspaces", requireAuth, async (req, res) => {
  const title = sanitizeText(req.body?.title || "Untitled source", 140);
  const sourceType = sanitizeText(req.body?.sourceType || "Document", 40);
  const sourceUrl = sanitizeText(req.body?.sourceUrl || "", 240);
  const sourceContent = sanitizeText(req.body?.sourceContent || "", 16000);
  const mode = sanitizeText(req.body?.mode || "Beginner", 30);
  const outputs = req.body?.outputs || null;

  if (!sourceContent || !outputs) {
    res.status(400).json({ ok: false, error: "Workspace content and outputs are required." });
    return;
  }

  const db = req.auth.db;
  const workspace = {
    id: createId("workspace"),
    userId: req.auth.user.id,
    title,
    sourceType,
    sourceUrl,
    sourceContent,
    mode,
    outputs,
    savedAt: new Date().toISOString()
  };

  db.workspaces.unshift(workspace);
  await writeDb(db);

  res.json({ ok: true, workspace });
});

app.post("/api/generate-insights", rateLimit, requireAuth, async (req, res) => {
  const content = sanitizeText(req.body?.content || "", 14001);
  const source = sanitizeText(req.body?.source || "Uploaded Source", 120);
  if (!content) {
    res.status(400).json({ ok: false, error: "Source content is required." });
    return;
  }

  try {
    const payload = await generateInsights(req.body || {});
    res.json({ ok: true, payload });
  } catch (_error) {
    res.json({
      ok: true,
      payload: fallbackFor(sanitizeText(req.body?.mode || "Beginner", 24), source),
      warning: "Live model request failed. Fallback outputs were returned."
    });
  }
});

app.get("/api/health", async (_req, res) => {
  const db = await readDb();
  res.json({
    ok: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    model,
    port,
    rateLimitMax,
    users: db.users.length,
    workspaces: db.workspaces.length
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`AtlasIQ Ops server running at http://localhost:${port}`);
});



