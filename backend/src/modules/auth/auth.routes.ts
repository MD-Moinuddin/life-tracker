import { Router } from "express";
import { signupHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/signup", signupHandler);
