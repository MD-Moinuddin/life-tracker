import "dotenv/config";
import { z } from "zod";

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().default(4000),
    BCRYPT_COST: z.coerce.number().default(12),
    CORS_ORIGIN: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    BREVO_API_KEY: z.string().min(1).optional(),
    MAIL_FROM_EMAIL: z.email().optional(),
    MAIL_FROM_NAME: z.string().min(1).default("Life Tracker"),
  })
  .superRefine((value, ctx) => {
    const isProduction = value.NODE_ENV === "production";
    if (isProduction && !value.BREVO_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["BREVO_API_KEY"],
        message: "Required in production",
      });
    }
    if ((isProduction || value.BREVO_API_KEY) && !value.MAIL_FROM_EMAIL) {
      ctx.addIssue({
        code: "custom",
        path: ["MAIL_FROM_EMAIL"],
        message: "Required when emails are sent",
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment variables:",
    result.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = result.data;
