import { Hono } from "hono";
import { MidtransService } from "../services/midtrans.service";
import { AppEnv } from "../types";

const paymentRoutes = new Hono<AppEnv>();

// Security middleware checking for X-App-Secret header
paymentRoutes.use("*", async (c, next) => {
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

// 1. Charge endpoint (Create SNAP Transaction)
paymentRoutes.post("/charge", async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, grossAmount, name, email } = body;
    
    if (!orderId || !grossAmount) {
      return c.json({ error: "orderId and grossAmount are required" }, 400);
    }

    if (!c.env.MIDTRANS_SERVER_KEY) {
      return c.json({ error: "MIDTRANS_SERVER_KEY is not configured on the server" }, 500);
    }

    const midtransService = new MidtransService(c.env.MIDTRANS_SERVER_KEY, false);
    const result = await midtransService.createTransaction(orderId, grossAmount, { name, email });
    
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || "An error occurred" }, 500);
  }
});

// 2. Status check endpoint (Query Midtrans transaction status)
paymentRoutes.get("/status/:orderId", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    
    if (!c.env.MIDTRANS_SERVER_KEY) {
      return c.json({ error: "MIDTRANS_SERVER_KEY is not configured on the server" }, 500);
    }

    const midtransService = new MidtransService(c.env.MIDTRANS_SERVER_KEY, false);
    const result = await midtransService.getTransactionStatus(orderId);
    
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || "An error occurred" }, 500);
  }
});

export { paymentRoutes };
