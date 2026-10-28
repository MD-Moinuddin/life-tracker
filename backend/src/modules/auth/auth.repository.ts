import { prisma } from "../../lib/prisma";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({ data });
}

export async function findLatestResetTokenCreatedAt(
  userId: string,
): Promise<Date | null> {
  const latest = await prisma.passwordResetToken.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return latest?.createdAt ?? null;
}

// Stores a new token and, in the same transaction, removes this user's
// unused tokens and every expired token, so old links stop working.
export function replaceResetToken(
  data: { userId: string; tokenHash: string; expiresAt: Date },
  now: Date,
) {
  return prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { userId: data.userId, usedAt: null }],
      },
    }),
    prisma.passwordResetToken.create({ data }),
  ]);
}

// Marks the token used and sets the new password in one transaction.
// Returns false (and changes nothing) when no usable token matches.
export function resetPasswordWithToken(params: {
  tokenHash: string;
  passwordHash: string;
  now: Date;
}): Promise<boolean> {
  const { tokenHash, passwordHash, now } = params;
  return prisma.$transaction(async (tx) => {
    const token = await tx.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
    });
    if (!token) {
      return false;
    }

    // Claiming the token with a conditional update makes it single use even
    // when two requests with the same token arrive together.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: now },
    });
    if (claimed.count === 0) {
      return false;
    }

    await tx.user.update({
      where: { id: token.userId },
      data: { passwordHash, passwordChangedAt: now },
    });
    return true;
  });
}
