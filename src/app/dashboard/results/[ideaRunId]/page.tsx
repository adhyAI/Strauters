import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/db";
import type { SynthesizedIdea } from "@/lib/panel";
import ResultsClient from "./ResultsClient";
import StepIndicator from "@/components/StepIndicator";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ ideaRunId: string }>;
}) {
  const { ideaRunId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const ideaRun = await prisma.ideaRun.findUnique({
    where: { id: ideaRunId },
    include: { team: true, selectedIdea: true },
  });

  if (!ideaRun || ideaRun.team.ownerId !== user.id) notFound();

  const ideas = ideaRun.synthesizedIdeas as unknown as SynthesizedIdea[];

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 py-20 px-6">
        <div>
          <StepIndicator current={1} />
          <h1 className="mt-3 text-2xl font-semibold text-black dark:text-zinc-50">
            Your shortlist
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Pick one to see the full brief. Deploying a live version requires
            Pro.
          </p>
        </div>
        <ResultsClient
          ideaRunId={ideaRun.id}
          ideas={ideas}
          subscriptionTier={user.subscriptionTier}
          userId={user.id}
          alreadySelected={Boolean(ideaRun.selectedIdea)}
          selectedIdeaId={ideaRun.selectedIdea?.id}
        />
      </main>
    </div>
  );
}
