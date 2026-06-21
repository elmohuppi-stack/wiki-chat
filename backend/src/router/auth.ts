import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { login, register } from "../service/auth.ts";

const authRouter = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  try {
    const result = await register(email, password, name);
    return c.json(result, 201);
  } catch (e: any) {
    return c.json({ error: e?.message || "Registration failed" }, 400);
  }
});

authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  try {
    const result = await login(email, password);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e?.message || "Login failed" }, 401);
  }
});

export { authRouter };
