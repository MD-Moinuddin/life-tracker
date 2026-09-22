import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { generalLimiter } from "./middleware/rate-limit";
import { formatUptime } from "./lib/format";

const app = express();

// Two trusted hops in front of the app: Vercel's rewrite proxy, then
// Render's own load balancer. Needed for express-rate-limit to key on the
// real client IP instead of one of the proxies.
app.set("trust proxy", 2);

app.use(helmet());
app.use(generalLimiter);
app.use(
  cors({
    // No origin at all means a non-browser client (curl, a server-to-server
    // call) — CORS only exists to restrict browsers, so there's nothing to
    // check there. A real browser origin has to match exactly.
    origin: (origin, callback) => {
      callback(null, !origin || origin === env.CORS_ORIGIN);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: formatUptime(process.uptime()) });
});

app.use("/api/auth", authRouter);

app.use(errorHandler);

export default app;
