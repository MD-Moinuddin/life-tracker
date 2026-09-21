import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hashPassword("DevPassword1");

  // upsert, not create — safe to re-run without a unique-email conflict.
  await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      name: "Dev User",
      email: "dev@example.com",
      passwordHash,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
