"use client";

import { useState } from "react";

interface Props {
  selectedIdeaId: string;
  markdown: string;
  subscriptionTier: string;
  deployment: { status: string; deployedUrl: string | null } | null;
}

export default function BriefClient({
  selectedIdeaId,
  markdown,
  subscriptionTier,
  deployment,
}: Props) {
  const [deployState, setDeployState] = useState(deployment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleDeploy() {
    setError(null);
    setLoading(true);
    setDeployState({ status: "provisioning", deployedUrl: null });
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIdeaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Deploy failed");
      setDeployState({ status: "live", deployedUrl: data.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeployState({ status: "failed", deployedUrl: null });
    } finally {
      setLoading(false);
    }
  }

  async function upgrade() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setCheckoutLoading(false);
    }
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project-brief.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Your project brief
        </h1>
        <button
          onClick={downloadMarkdown}
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Download .md
        </button>
      </div>

      <pre className="whitespace-pre-wrap rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {markdown}
      </pre>

      <div className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
        <h2 className="mb-2 text-lg font-semibold text-black dark:text-zinc-50">
          Deploy this live
        </h2>

        {subscriptionTier !== "pro" ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Deploying a live version requires Pro.
            </span>
            <button
              onClick={upgrade}
              disabled={checkoutLoading}
              className="rounded-full bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {checkoutLoading ? "Loading..." : "Upgrade $5/mo"}
            </button>
          </div>
        ) : deployState?.status === "live" && deployState.deployedUrl ? (
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-emerald-600">Live!</span>
            <a
              href={deployState.deployedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {deployState.deployedUrl}
            </a>
          </div>
        ) : (
          <button
            onClick={handleDeploy}
            disabled={loading}
            className="rounded-full bg-foreground px-5 py-2 text-sm text-background hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {loading ? "Provisioning + deploying..." : "Deploy live"}
          </button>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
