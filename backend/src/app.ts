import express from "express";
import helmet from "helmet";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";

const app = express();

app.use(helmet());
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

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use(errorHandler);

export default app;
