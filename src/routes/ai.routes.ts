import { Hono } from "hono";
import { AIService } from "../services/ai.service";
import { AppEnv } from "../types";

const aiRoutes = new Hono<AppEnv>();

// Security middleware checking for X-App-Secret header
aiRoutes.use("*", async (c, next) => {
  const incomingSecret = c.req.header("X-App-Secret");
  const expectedSecret = c.env.APP_SECRET_TOKEN;

  if (!expectedSecret) {
    console.error("APP_SECRET_TOKEN is not configured on the server!");
    return c.json({ error: "Server Configuration Error" }, 500);
  }

  if (!incomingSecret || incomingSecret !== expectedSecret) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

// 1. Groq Chat Completion Route
aiRoutes.post("/groq", async (c) => {
  try {
    const body = await c.req.json();
    const query = body.query;
    if (!query) {
      return c.json({ error: "Query is required" }, 400);
    }

    const aiService = new AIService(c.env);
    const result = await aiService.fetchGroqNutrition(query);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || "An error occurred" }, 500);
  }
});

// 2. Gemini Image Analysis Route
aiRoutes.post("/gemini", async (c) => {
  try {
    const body = await c.req.json();
    const { image, mimeType } = body;
    if (!image || !mimeType) {
      return c.json({ error: "Image (base64) and mimeType are required" }, 400);
    }

    const aiService = new AIService(c.env);
    const result = await aiService.analyzeGeminiImage(image, mimeType);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || "An error occurred" }, 500);
  }
});

// 3. Cloudinary Image Upload Route
aiRoutes.post("/cloudinary/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    const folder = body.folder as string | undefined;

    if (!file) {
      return c.json({ error: "File is required" }, 400);
    }

    const aiService = new AIService(c.env);
    const result = await aiService.uploadToCloudinary(file, folder);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || "An error occurred" }, 500);
  }
});

export { aiRoutes };
