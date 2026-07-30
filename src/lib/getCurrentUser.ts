import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth0.getSession();
  if (!session) return null;

  return prisma.user.upsert({
    where: { auth0Sub: session.user.sub },
    update: { email: session.user.email ?? "" },
    create: {
      auth0Sub: session.user.sub,
      email: session.user.email ?? "",
    },
  });
}
