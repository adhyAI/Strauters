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

export function deriveTemplateConfig(idea: {
  title: string;
  description: string;
}): TemplateConfig {
  return {
    appName: idea.title,
    tagline: idea.description,
    entityFields: ["Name", "Status", "Owner"],
    accentColor: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
  };
}

const TEMPLATES_ROOT = path.join(process.cwd(), "templates");

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
    let content = await fs.readFile(srcPath, "utf-8");
    content = content
      .replaceAll("{{APP_NAME}}", escapeHtml(config.appName))
      .replaceAll("{{TAGLINE}}", escapeHtml(config.tagline))
      .replaceAll("{{ACCENT_COLOR}}", config.accentColor)
      .replaceAll("{{ENTITY_FIELDS_JSON}}", JSON.stringify(config.entityFields));
    await fs.writeFile(destPath, content, "utf-8");
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
