import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Skipped in tests: rate limiting is infrastructure, not the thing being
// tested, and a real test run can easily exceed 5 auth requests on its own.
const skipInTest = () => env.NODE_ENV === "test";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  skip: skipInTest,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skip: skipInTest,
});
