import { z } from "zod";
import { Priority, ProjectStatus, RiskLevel, WaitingOn } from "./enums";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Verwacht datumformaat YYYY-MM-DD");

export const ProjectMeta = z.object({
  id: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "id moet lowercase, alfanumeriek en streepjes zijn",
    ),
  name: z.string().min(1),
  client: z.string().default("intern"),
  type: z.string().default("project"),
  status: ProjectStatus.default("active"),
  phase: z.string().default(""),
  priority: Priority.default("medium"),
  tags: z.array(z.string()).default([]),
  waitingOn: WaitingOn.default("unclear"),
  nextAction: z.string().default(""),
  riskLevel: RiskLevel.default("unclear"),
  lastUpdated: isoDate.optional(),
  createdAt: isoDate.optional(),
});

export type ProjectMeta = z.infer<typeof ProjectMeta>;
