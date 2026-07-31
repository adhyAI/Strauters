"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SynthesizedIdea } from "@/lib/panel";
import { buildUpgradeLink } from "@/lib/paymentLink";

interface Props {
  ideaRunId: string;
  ideas: SynthesizedIdea[];
  subscriptionTier: string;
  userId: string;
  alreadySelected: boolean;
  selectedIdeaId?: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  "crud-dashboard": "CRUD Dashboard",
  "tracker-chart": "Tracker + Chart",
  "content-generator": "Content Generator",
};

export default function ResultsClient({
  ideaRunId,
  ideas,
  subscriptionTier,
  userId,
  alreadySelected,
  selectedIdeaId,
}: Props) {
  const router = useRouter();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectIdea(index: number) {
    setError(null);
    setLoadingIndex(index);
    try {
      const res = await fetch("/api/select-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaRunId, ideaIndex: index }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to select idea");
      }
      const data = await res.json();
      router.push(`/dashboard/brief/${data.selectedIdeaId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingIndex(null);
    }
  }

  if (alreadySelected && selectedIdeaId) {
    router.replace(`/dashboard/brief/${selectedIdeaId}`);
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {subscriptionTier !== "pro" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
          <span className="text-amber-900 dark:text-amber-200">
            You&apos;re on the free tier &mdash; you can pick an idea and get
            the brief, but deploying it live needs Pro.
          </span>
          <a
            href={buildUpgradeLink(userId)}
            className="ml-4 shrink-0 rounded-full bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
          >
            Upgrade $5/mo
          </a>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {ideas.map((idea, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-lg border border-zinc-300 p-4 dark:border-zinc-700"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              {idea.title}
            </h2>
            <span className="rounded-full bg-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {TEMPLATE_LABELS[idea.templateId] ?? idea.templateId}
            </span>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {idea.description}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {idea.rationale}
          </p>
          <button
            onClick={() => selectIdea(i)}
            disabled={loadingIndex !== null}
            className="mt-2 self-start rounded-full bg-accent px-5 py-2 text-sm text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loadingIndex === i ? "Selecting..." : "Pick this idea"}
          </button>
        </div>
      ))}
    </div>
  );
}
