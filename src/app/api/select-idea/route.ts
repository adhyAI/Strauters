import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/db";
import type { SynthesizedIdea } from "@/lib/panel";

function buildDeliverableMarkdown(idea: SynthesizedIdea, hackathonDescription: string) {
  const rolesList = idea.memberRoles
    .map((r) => `- **${r.name}**: ${r.role}`)
    .join("\n");

  return `# ${idea.title}

## Brief
${hackathonDescription}

## Idea
${idea.description}

## Why this fits your team
${idea.rationale}

## Suggested roles
${rolesList}

## Starter template
This idea will be scaffolded from the **${idea.templateId}** template.

## Stretch goals
- Polish the UI and add empty/loading states
- Add basic error handling on the core flow
- Write a 60-second demo script highlighting the "wow" moment
`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const ideaRunId: string = body.ideaRunId;
  const ideaIndex: number = body.ideaIndex;

  const ideaRun = await prisma.ideaRun.findUnique({
    where: { id: ideaRunId },
    include: { team: true, selectedIdea: true },
  });

  if (!ideaRun || ideaRun.team.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (ideaRun.selectedIdea) {
    return NextResponse.json({ selectedIdeaId: ideaRun.selectedIdea.id });
  }

  const ideas = ideaRun.synthesizedIdeas as unknown as SynthesizedIdea[];
  const idea = ideas[ideaIndex];
  if (!idea) {
    return NextResponse.json({ error: "Invalid idea index" }, { status: 400 });
  }

  const selectedIdea = await prisma.selectedIdea.create({
    data: {
      ideaRunId: ideaRun.id,
      chosenIdea: JSON.parse(JSON.stringify(idea)),
      templateId: idea.templateId,
      deliverableMarkdown: buildDeliverableMarkdown(
        idea,
        ideaRun.team.hackathonDescription
      ),
    },
  });

  return NextResponse.json({ selectedIdeaId: selectedIdea.id });
}
