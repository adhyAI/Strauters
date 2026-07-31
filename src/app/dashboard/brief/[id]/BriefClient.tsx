"use client";

import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import { buildUpgradeLink } from "@/lib/paymentLink";

interface Props {
  selectedIdeaId: string;
  markdown: string;
  subscriptionTier: string;
  userId: string;
  previewHtml: string;
  deployment: { status: string; deployedUrl: string | null } | null;
}

export default function BriefClient({
  selectedIdeaId,
  markdown,
  subscriptionTier,
  userId,
  previewHtml,
  deployment,
}: Props) {
  const [deployState, setDeployState] = useState(deployment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

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
      setPreviewKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeployState({ status: "failed", deployedUrl: null });
    } finally {
      setLoading(false);
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

  const isLive = deployState?.status === "live" && deployState.deployedUrl;

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator current={isLive ? 3 : 2} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* Left: brief + deploy controls */}
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

          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            {markdown}
          </pre>

          <div className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-zinc-50">
              Deploy this live
            </h2>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
              The preview on the right is free and instant. Deploying it to a
              real public URL costs $5/mo (Pro).
            </p>

            {isLive ? (
              <div className="flex flex-col gap-2 text-sm">
                <span className="text-emerald-600">Live!</span>
                <a
                  href={deployState.deployedUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  {deployState.deployedUrl}
                </a>
                <button
                  onClick={handleDeploy}
                  disabled={loading}
                  className="mt-1 self-start text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Redeploy
                </button>
              </div>
            ) : subscriptionTier !== "pro" ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Ready when you are.
                </span>
                <a
                  href={buildUpgradeLink(userId)}
                  className="rounded-full bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
                >
                  Upgrade $5/mo to deploy
                </a>
              </div>
            ) : (
              <button
                onClick={handleDeploy}
                disabled={loading}
                className="rounded-full bg-accent px-5 py-2 text-sm text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Provisioning + deploying..." : "Deploy live"}
              </button>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        {/* Right: instant local preview, or live URL once deployed */}
        <div className="flex flex-col gap-2 lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {isLive ? "Live" : "Preview"}
            </h2>
            {isLive && (
              <a
                href={deployState.deployedUrl!}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Open in new tab
              </a>
            )}
          </div>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            {isLive ? (
              <iframe
                key={previewKey}
                src={deployState.deployedUrl!}
                className="h-full w-full border-0"
                title="Deployed app"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="h-full w-full border-0"
                title="App preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
