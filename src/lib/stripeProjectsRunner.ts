import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as archiver from "archiver";
import { renderTemplate, deriveTemplateConfig, type TemplateConfig } from "@/lib/templateInject";
import type { TemplateId } from "@/lib/panel";

// Credentials used below (NETLIFY_NETLIFY_AUTH_TOKEN / NETLIFY_NETLIFY_SITE_ID)
// were provisioned via the real Stripe Projects CLI: `stripe projects add
// netlify/project`. This module is the "wrapper around Stripe Projects" --
// it takes the credentials Stripe Projects generated and uses them to push
// generated app content live, with no manual signup/config by the end user.

async function zipDirectory(sourceDir: string, outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outFile);
    const archive = new archiver.ZipArchive({ zlib: { level: 9 } });
    output.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

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

  const config: TemplateConfig = deriveTemplateConfig(idea);
  log.push(`Rendering template "${templateId}" into ${workDir}`);
  await renderTemplate(templateId, config, workDir);

  const zipPath = path.join(os.tmpdir(), "hackathon-deploys", `${runId}.zip`);
  log.push("Zipping rendered app");
  await zipDirectory(workDir, zipPath);

  const token = process.env.NETLIFY_NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_NETLIFY_SITE_ID;
  if (!token || !siteId) {
    throw new Error(
      "Netlify credentials not found -- was `stripe projects add netlify/project` run?"
    );
  }

  log.push(`Uploading to Netlify site ${siteId} (credentials from Stripe Projects)`);
  const zipBuffer = await fsp.readFile(zipPath);
  const deployRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/zip",
      },
      body: new Uint8Array(zipBuffer),
    }
  );

  if (!deployRes.ok) {
    const text = await deployRes.text();
    throw new Error(`Netlify deploy failed: ${deployRes.status} ${text}`);
  }

  const deployData = await deployRes.json();
  log.push(`Deploy created: ${deployData.id}, state=${deployData.state}`);

  const url = deployData.ssl_url || deployData.url || `https://${siteId}.netlify.app`;

  await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {});
  await fsp.rm(zipPath, { force: true }).catch(() => {});

  return { url, workDir, log };
}
