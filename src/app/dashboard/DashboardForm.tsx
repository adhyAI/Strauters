"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MemberField {
  name: string;
  githubUsername: string;
  bio: string;
}

interface PersonaProgress {
  personaId: string;
  displayName: string;
  status: "thinking" | "done";
  take?: string;
  disclaimer?: string;
}

export default function DashboardForm() {
  const router = useRouter();
  const [hackathonDescription, setHackathonDescription] = useState("");
  const [members, setMembers] = useState<MemberField[]>([
    { name: "", githubUsername: "", bio: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [panelProgress, setPanelProgress] = useState<PersonaProgress[]>([]);

  function updateMember(index: number, field: keyof MemberField, value: string) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function addMember() {
    if (members.length >= 3) return;
    setMembers((prev) => [...prev, { name: "", githubUsername: "", bio: "" }]);
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPanelProgress([]);
    setStatusMessage("Starting...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathonDescription,
          members: members.filter((m) => m.name && m.githubUsername),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate ideas");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const line = rawEvent.trim();
          if (!line.startsWith("data:")) continue;
          const payload = JSON.parse(line.slice(5).trim());

          switch (payload.type) {
            case "status":
              setStatusMessage(payload.message);
              break;
            case "persona_start":
              setStatusMessage(null);
              setPanelProgress((prev) => [
                ...prev,
                {
                  personaId: payload.personaId,
                  displayName: payload.displayName,
                  status: "thinking",
                },
              ]);
              break;
            case "persona_done":
              setPanelProgress((prev) =>
                prev.map((p) =>
                  p.personaId === payload.personaId
                    ? { ...p, status: "done", take: payload.take, disclaimer: payload.disclaimer }
                    : p
                )
              );
              break;
            case "done":
              router.push(`/dashboard/results/${payload.ideaRunId}`);
              return;
            case "error":
              throw new Error(payload.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black dark:text-zinc-50">
          Hackathon brief
        </label>
        <textarea
          required
          rows={5}
          value={hackathonDescription}
          onChange={(e) => setHackathonDescription(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          placeholder="Paste the hackathon description here..."
        />
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium text-black dark:text-zinc-50">
          Team members (up to 3)
        </label>
        {members.map((member, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-zinc-300 p-3 dark:border-zinc-700"
          >
            <div className="flex gap-2">
              <input
                required
                disabled={loading}
                placeholder="Name"
                value={member.name}
                onChange={(e) => updateMember(i, "name", e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <input
                required
                disabled={loading}
                placeholder="GitHub username"
                value={member.githubUsername}
                onChange={(e) => updateMember(i, "githubUsername", e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <input
              disabled={loading}
              placeholder="Short bio (optional)"
              value={member.bio}
              onChange={(e) => updateMember(i, "bio", e.target.value)}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            {members.length > 1 && !loading && (
              <button
                type="button"
                onClick={() => removeMember(i)}
                className="self-start text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {members.length < 3 && !loading && (
          <button
            type="button"
            onClick={addMember}
            className="self-start text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            + Add teammate
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          {statusMessage && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {statusMessage}
            </p>
          )}
          {panelProgress.map((p) => (
            <div key={p.personaId} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={
                    p.status === "thinking"
                      ? "h-2 w-2 animate-pulse rounded-full bg-amber-500"
                      : "h-2 w-2 rounded-full bg-emerald-500"
                  }
                />
                <span className="text-sm font-medium text-black dark:text-zinc-50">
                  {p.displayName}
                </span>
                <span className="text-xs text-zinc-400">
                  {p.status === "thinking" ? "thinking..." : "done"}
                </span>
              </div>
              {p.status === "done" && p.take && (
                <p className="ml-4 text-xs text-zinc-600 dark:text-zinc-400">
                  {p.take}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 items-center justify-center rounded-full bg-accent px-8 text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Working..." : "Generate ideas"}
      </button>
    </form>
  );
}
