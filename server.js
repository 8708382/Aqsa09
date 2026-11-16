import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "AQSA AI Brain" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = typeof req.body?.message === "string"
      ? req.body.message.trim()
      : "";

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (message.length > 12000) {
      return res.status(413).json({ error: "Message is too long." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "Server is missing OPENAI_API_KEY. Add it in Render Environment settings."
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: "You are AQSA AI, a helpful, clear and friendly assistant. Reply in the language used by the user.",
      input: message
    });

    res.json({ reply: response.output_text || "I couldn't generate a response." });
  } catch (error) {
    console.error("Chat API error:", error?.message || error);
    res.status(500).json({ error: "The AI service could not complete the request. Check the Render logs." });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AQSA AI Brain listening on port ${port}`);
});
