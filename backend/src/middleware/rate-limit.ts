import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Only enforced in production: rate limiting protects real traffic, not a
// test run or a developer's own machine repeatedly hitting these routes.
const skipOutsideProduction = () => env.NODE_ENV !== "production";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  skip: skipOutsideProduction,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skip: skipOutsideProduction,
});
