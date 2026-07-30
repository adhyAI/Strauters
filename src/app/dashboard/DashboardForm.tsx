"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MemberField {
  name: string;
  githubUsername: string;
  bio: string;
}

export default function DashboardForm() {
  const router = useRouter();
  const [hackathonDescription, setHackathonDescription] = useState("");
  const [members, setMembers] = useState<MemberField[]>([
    { name: "", githubUsername: "", bio: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathonDescription,
          members: members.filter((m) => m.name && m.githubUsername),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate ideas");
      }
      const data = await res.json();
      router.push(`/dashboard/results/${data.ideaRunId}`);
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
                placeholder="Name"
                value={member.name}
                onChange={(e) => updateMember(i, "name", e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <input
                required
                placeholder="GitHub username"
                value={member.githubUsername}
                onChange={(e) => updateMember(i, "githubUsername", e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <input
              placeholder="Short bio (optional)"
              value={member.bio}
              onChange={(e) => updateMember(i, "bio", e.target.value)}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            {members.length > 1 && (
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
        {members.length < 3 && (
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

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {loading ? "Generating ideas..." : "Generate ideas"}
      </button>
    </form>
  );
}
