import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/db";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const teams = await prisma.team.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      members: true,
      ideaRuns: {
        orderBy: { createdAt: "desc" },
        include: { selectedIdea: { include: { deployment: true } } },
      },
    },
  });

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 py-20 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Your hackathons
          </h1>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            + New
          </Link>
        </div>

        {teams.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            You haven&apos;t submitted a hackathon brief yet.{" "}
            <Link href="/dashboard" className="underline">
              Start one
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-300 p-4 dark:border-zinc-700"
              >
                <p className="line-clamp-2 text-sm text-zinc-800 dark:text-zinc-200">
                  {team.hackathonDescription}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {team.members.map((m) => m.name).join(", ")} &middot;{" "}
                  {new Date(team.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {team.ideaRuns.map((run) => {
                    const selected = run.selectedIdea;
                    const deployment = selected?.deployment;
                    return (
                      <Link
                        key={run.id}
                        href={
                          selected
                            ? `/dashboard/brief/${selected.id}`
                            : `/dashboard/results/${run.id}`
                        }
                        className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        {selected
                          ? deployment?.status === "live"
                            ? `${(selected.chosenIdea as { title?: string })?.title ?? "Idea"} — live`
                            : (selected.chosenIdea as { title?: string })?.title ?? "Idea"
                          : "View shortlist"}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
