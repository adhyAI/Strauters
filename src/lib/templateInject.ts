import fs from "node:fs/promises";
import path from "node:path";
import type { TemplateId } from "@/lib/panel";

export interface TemplateConfig {
  appName: string;
  tagline: string;
  entityFields: string[];
  accentColor: string;
}

const ACCENT_COLORS = ["#6366f1", "#059669", "#db2777", "#ea580c", "#0891b2"];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function deriveTemplateConfig(idea: {
  title: string;
  description: string;
}): TemplateConfig {
  return {
    appName: idea.title,
    tagline: idea.description,
    entityFields: ["Name", "Status", "Owner"],
    // Deterministic (not random) so preview and real deploy always match.
    accentColor: ACCENT_COLORS[hashString(idea.title) % ACCENT_COLORS.length],
  };
}

const TEMPLATES_ROOT = path.join(process.cwd(), "templates");

function fillPlaceholders(content: string, config: TemplateConfig): string {
  return content
    .replaceAll("{{APP_NAME}}", escapeHtml(config.appName))
    .replaceAll("{{TAGLINE}}", escapeHtml(config.tagline))
    .replaceAll("{{ACCENT_COLOR}}", config.accentColor)
    .replaceAll("{{ENTITY_FIELDS_JSON}}", JSON.stringify(config.entityFields));
}

/** Renders a template's entry HTML file to a string, for an instant local preview (no deploy needed). */
export async function renderTemplateToString(
  templateId: TemplateId,
  config: TemplateConfig
): Promise<string> {
  const filePath = path.join(TEMPLATES_ROOT, templateId, "index.html");
  const content = await fs.readFile(filePath, "utf-8");
  return fillPlaceholders(content, config);
}

export async function renderTemplate(
  templateId: TemplateId,
  config: TemplateConfig,
  outDir: string
): Promise<void> {
  const srcDir = path.join(TEMPLATES_ROOT, templateId);
  await fs.mkdir(outDir, { recursive: true });

  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(outDir, entry.name);
    if (entry.isDirectory()) {
      await renderTemplate(templateId, config, destPath);
      continue;
    }
    const content = fillPlaceholders(await fs.readFile(srcPath, "utf-8"), config);
    await fs.writeFile(destPath, content, "utf-8");
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
