import type { NextFunction, Request, Response } from "express";
import { EmailAlreadyRegisteredError, signup } from "./auth.service";
import { signupSchema } from "./auth.schema";

export async function signupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        fields: parsed.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const user = await signup(parsed.data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      res.status(409).json({ error: { message: error.message } });
      return;
    }
    next(error);
  }
}
