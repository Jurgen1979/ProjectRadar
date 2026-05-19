import { z } from "zod";
import { AiProvider } from "./enums";

export const ProjectradarConfig = z.object({
  version: z.string().default("1.0.0"),
  projectRoot: z.string().default("./projects"),
  defaultLanguage: z.string().default("nl"),
  aiProvider: AiProvider.default("none"),
  model: z.string().default(""),
  reviewWindowDays: z.number().int().positive().default(30),
  maxUpdatesForStatusGeneration: z.number().int().positive().default(10),
  staleDays: z.number().int().positive().default(14),
  dateFormat: z.string().default("YYYY-MM-DD"),
  backupOnStatusOverwrite: z.boolean().default(true),
});

export type ProjectradarConfig = z.infer<typeof ProjectradarConfig>;

export const DEFAULT_CONFIG: ProjectradarConfig = ProjectradarConfig.parse({});
