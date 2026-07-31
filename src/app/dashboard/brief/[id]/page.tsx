import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/db";
import { deriveTemplateConfig, renderTemplateToString } from "@/lib/templateInject";
import type { TemplateId, SynthesizedIdea } from "@/lib/panel";
import BriefClient from "./BriefClient";

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const selectedIdea = await prisma.selectedIdea.findUnique({
    where: { id },
    include: { ideaRun: { include: { team: true } }, deployment: true },
  });

  if (!selectedIdea || selectedIdea.ideaRun.team.ownerId !== user.id) notFound();

  const idea = selectedIdea.chosenIdea as unknown as SynthesizedIdea;
  const previewConfig = deriveTemplateConfig(idea);
  const previewHtml = await renderTemplateToString(
    selectedIdea.templateId as TemplateId,
    previewConfig
  );

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-6xl flex-col gap-8 py-20 px-6">
        <BriefClient
          selectedIdeaId={selectedIdea.id}
          markdown={selectedIdea.deliverableMarkdown}
          subscriptionTier={user.subscriptionTier}
          userId={user.id}
          previewHtml={previewHtml}
          deployment={
            selectedIdea.deployment
              ? {
                  status: selectedIdea.deployment.status,
                  deployedUrl: selectedIdea.deployment.deployedUrl,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
