import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/db";
import { deployTemplate } from "@/lib/stripeProjectsRunner";
import type { TemplateId } from "@/lib/panel";
import type { SynthesizedIdea } from "@/lib/panel";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.subscriptionTier !== "pro") {
    return NextResponse.json(
      { error: "Deploying live requires a Pro subscription" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const selectedIdeaId: string = body.selectedIdeaId;

  const selectedIdea = await prisma.selectedIdea.findUnique({
    where: { id: selectedIdeaId },
    include: { ideaRun: { include: { team: true } }, deployment: true },
  });

  if (!selectedIdea || selectedIdea.ideaRun.team.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deploymentRecord = await prisma.deployment.upsert({
    where: { selectedIdeaId },
    update: { status: "provisioning" },
    create: {
      selectedIdeaId,
      templateId: selectedIdea.templateId,
      injectedConfig: {},
      status: "provisioning",
    },
  });

  try {
    const idea = selectedIdea.chosenIdea as unknown as SynthesizedIdea;
    const result = await deployTemplate(selectedIdea.templateId as TemplateId, idea);

    const updated = await prisma.deployment.update({
      where: { id: deploymentRecord.id },
      data: {
        status: "live",
        deployedUrl: result.url,
        workDir: result.workDir,
        cliLog: result.log.join("\n"),
      },
    });

    return NextResponse.json({ url: updated.deployedUrl, status: updated.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.deployment.update({
      where: { id: deploymentRecord.id },
      data: { status: "failed", cliLog: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
