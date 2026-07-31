import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/db";
import { fetchGithubSummary } from "@/lib/github";
import { runPersonaPanel, synthesizeIdeas } from "@/lib/panel";

interface MemberInput {
  name: string;
  githubUsername: string;
  bio?: string;
}

function sseEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  const body = await request.json();
  const hackathonDescription: string = body.hackathonDescription;
  const members: MemberInput[] = body.members ?? [];

  if (!hackathonDescription || members.length === 0) {
    return new Response(
      JSON.stringify({
        error: "hackathonDescription and at least one member are required",
      }),
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(sseEvent(data)));

      try {
        send({ type: "status", message: "Looking up GitHub profiles..." });
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

        const panelTakes = await runPersonaPanel(panelInput, {
          onPersonaStart: (personaId, displayName) => {
            send({ type: "persona_start", personaId, displayName });
          },
          onPersonaDone: (take) => {
            send({ type: "persona_done", ...take });
          },
        });

        send({ type: "status", message: "Synthesizing shortlist..." });
        const synthesizedIdeas = await synthesizeIdeas(panelInput, panelTakes);

        const ideaRun = await prisma.ideaRun.create({
          data: {
            teamId: team.id,
            panelOutputs: JSON.parse(JSON.stringify(panelTakes)),
            synthesizedIdeas: JSON.parse(JSON.stringify(synthesizedIdeas)),
          },
        });

        send({ type: "done", ideaRunId: ideaRun.id });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Something went wrong",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
