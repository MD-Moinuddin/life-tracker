import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Only enforced in production: rate limiting protects real traffic, not a
// test run or a developer's own machine repeatedly hitting these routes.
const skipOutsideProduction = () => env.NODE_ENV !== "production";

const TOO_MANY_REQUESTS_BODY = {
  error: { message: "Too many requests, please try again later." },
};

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  skip: skipOutsideProduction,
  message: TOO_MANY_REQUESTS_BODY,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skip: skipOutsideProduction,
  message: TOO_MANY_REQUESTS_BODY,
});
