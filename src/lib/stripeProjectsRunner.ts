import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { renderTemplateToString, deriveTemplateConfig } from "@/lib/templateInject";
import type { TemplateId } from "@/lib/panel";

// Credentials used below (VERCEL_TOKEN / VERCEL_PROJECT_ID / VERCEL_ORG_ID)
// were provisioned via the real Stripe Projects CLI: `stripe projects add
// vercel/project`. This module is the "wrapper around Stripe Projects" --
// it takes the credentials Stripe Projects generated and uses them to push
// generated app content live, with no manual signup/config by the end user.

export interface DeployResult {
  url: string;
  workDir: string;
  log: string[];
}

export async function deployTemplate(
  templateId: TemplateId,
  idea: { title: string; description: string }
): Promise<DeployResult> {
  const log: string[] = [];
  const runId = `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const workDir = path.join(os.tmpdir(), "hackathon-deploys", runId);
  await fsp.mkdir(workDir, { recursive: true });

  const config = deriveTemplateConfig(idea);
  log.push(`Rendering template "${templateId}"`);
  const html = await renderTemplateToString(templateId, config);
  await fsp.writeFile(path.join(workDir, "index.html"), html, "utf-8");

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const orgId = process.env.VERCEL_ORG_ID;
  if (!token || !projectId) {
    throw new Error(
      "Vercel credentials not found -- was `stripe projects add vercel/project` run?"
    );
  }

  // Team projects default to Vercel's SSO deployment protection, which would
  // otherwise gate the public URL behind a login wall. Disable it once; a
  // no-op on subsequent calls since it's idempotent.
  const projectUrl = new URL(`https://api.vercel.com/v9/projects/${projectId}`);
  if (orgId) projectUrl.searchParams.set("teamId", orgId);
  await fetch(projectUrl.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ssoProtection: null }),
  });

  const deployName = `hackathon-idea-${runId}`.toLowerCase();
  log.push(`Creating Vercel deployment "${deployName}" (credentials from Stripe Projects)`);

  const url = new URL("https://api.vercel.com/v13/deployments");
  if (orgId) url.searchParams.set("teamId", orgId);

  const deployRes = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: deployName,
      project: projectId,
      target: "production",
      files: [{ file: "index.html", data: html }],
      projectSettings: { framework: null },
    }),
  });

  if (!deployRes.ok) {
    const text = await deployRes.text();
    throw new Error(`Vercel deploy failed: ${deployRes.status} ${text}`);
  }

  const deployData = await deployRes.json();
  log.push(`Deploy created: ${deployData.id ?? deployData.uid}, state=${deployData.readyState}`);

  const deployedUrl = deployData.url ? `https://${deployData.url}` : null;
  if (!deployedUrl) {
    throw new Error("Vercel deploy succeeded but returned no URL");
  }

  await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {});

  return { url: deployedUrl, workDir, log };
}
