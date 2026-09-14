import express from "express";
import { authRouter } from "./modules/auth/auth.routes";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

export default app;
