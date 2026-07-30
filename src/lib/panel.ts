import { LLM_MODEL, chatCompletionWithRetry } from "@/lib/llm";
import { PERSONAS } from "@/lib/personas";
import type { GithubSummary } from "@/lib/github";

export interface PanelMember {
  name: string;
  githubUsername: string;
  bio?: string | null;
  githubSummary: GithubSummary | null;
}

export interface PanelInput {
  hackathonDescription: string;
  members: PanelMember[];
}

export interface PersonaTake {
  personaId: string;
  displayName: string;
  disclaimer: string;
  take: string;
}

export type TemplateId = "crud-dashboard" | "tracker-chart" | "content-generator";

export interface SynthesizedIdea {
  title: string;
  description: string;
  rationale: string;
  templateId: TemplateId;
  memberRoles: { name: string; role: string }[];
}

function buildTeamContext(input: PanelInput): string {
  const memberLines = input.members.map((m) => {
    const langs = m.githubSummary?.languages.join(", ") || "unknown";
    const repos =
      m.githubSummary?.topRepos.map((r) => r.name).join(", ") || "none found";
    return `- ${m.name} (github: ${m.githubUsername}): languages=${langs}; notable repos=${repos}; bio="${m.bio ?? m.githubSummary?.bio ?? ""}"`;
  });

  return `Hackathon brief:\n${input.hackathonDescription}\n\nTeam:\n${memberLines.join("\n")}`;
}

export async function runPersonaPanel(input: PanelInput): Promise<PersonaTake[]> {
  const context = buildTeamContext(input);

  // Sequential (not Promise.all) to avoid bursting the free-tier shared rate limit.
  const results: PersonaTake[] = [];
  for (const persona of PERSONAS) {
    const completion = await chatCompletionWithRetry({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: persona.systemPrompt },
        {
          role: "user",
          content: `${context}\n\nIn 3-4 sentences, propose the project idea and angle you'd push this team toward, given their skills and the brief.`,
        },
      ],
    });

    results.push({
      personaId: persona.id,
      displayName: persona.displayName,
      disclaimer: persona.disclaimer,
      take: completion.choices[0]?.message?.content?.trim() ?? "",
    });
  }

  return results;
}

const SYNTHESIS_SYSTEM_PROMPT = `You are a hackathon idea synthesizer. You receive several independent evaluations of a team + hackathon brief, and must merge them into a ranked shortlist of 3 concrete project ideas.

Each idea MUST be tagged with the single best-fit template from this fixed set (no other values allowed):
- "crud-dashboard": list/add/edit/delete a primary entity in a table
- "tracker-chart": log data points over time, visualize via a chart
- "content-generator": input a prompt, get AI-generated content, saved history list

Respond with ONLY valid JSON, an array of exactly 3 objects, each with keys:
title (string), description (string, 1-2 sentences), rationale (string, why this fits the team), templateId (one of the 3 values above), memberRoles (array of {name, role} covering every team member).`;

export async function synthesizeIdeas(
  input: PanelInput,
  panelTakes: PersonaTake[]
): Promise<SynthesizedIdea[]> {
  const context = buildTeamContext(input);
  const panelSummary = panelTakes
    .map((t) => `${t.displayName}: ${t.take}`)
    .join("\n\n");

  const completion = await chatCompletionWithRetry({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${context}\n\nPanel evaluations:\n${panelSummary}\n\nReturn the JSON array now.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

  return parsed as SynthesizedIdea[];
}
