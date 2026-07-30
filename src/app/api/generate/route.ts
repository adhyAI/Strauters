import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/db";
import { fetchGithubSummary } from "@/lib/github";
import { runPersonaPanel, synthesizeIdeas } from "@/lib/panel";

interface MemberInput {
  name: string;
  githubUsername: string;
  bio?: string;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const hackathonDescription: string = body.hackathonDescription;
  const members: MemberInput[] = body.members ?? [];

  if (!hackathonDescription || members.length === 0) {
    return NextResponse.json(
      { error: "hackathonDescription and at least one member are required" },
      { status: 400 }
    );
  }

  const githubSummaries = await Promise.all(
    members.map((m) => fetchGithubSummary(m.githubUsername))
  );

  const team = await prisma.team.create({
    data: {
      ownerId: user.id,
      hackathonDescription,
      members: {
        create: members.map((m, i) => ({
          name: m.name,
          githubUsername: m.githubUsername,
          bio: m.bio,
          githubSummary: githubSummaries[i]
            ? JSON.parse(JSON.stringify(githubSummaries[i]))
            : undefined,
        })),
      },
    },
    include: { members: true },
  });

  const panelInput = {
    hackathonDescription,
    members: team.members.map((m, i) => ({
      name: m.name,
      githubUsername: m.githubUsername,
      bio: m.bio,
      githubSummary: githubSummaries[i],
    })),
  };

  const panelTakes = await runPersonaPanel(panelInput);
  const synthesizedIdeas = await synthesizeIdeas(panelInput, panelTakes);

  const ideaRun = await prisma.ideaRun.create({
    data: {
      teamId: team.id,
      panelOutputs: JSON.parse(JSON.stringify(panelTakes)),
      synthesizedIdeas: JSON.parse(JSON.stringify(synthesizedIdeas)),
    },
  });

  return NextResponse.json({ ideaRunId: ideaRun.id });
}
