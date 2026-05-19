import { z } from "zod";

export const ProjectStatus = z.enum([
  "active",
  "paused",
  "waiting",
  "done",
  "archived",
  "idea",
]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const WaitingOn = z.enum([
  "me",
  "client",
  "third-party",
  "none",
  "unclear",
]);
export type WaitingOn = z.infer<typeof WaitingOn>;

export const RiskLevel = z.enum(["none", "low", "medium", "high", "unclear"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const Priority = z.enum(["low", "medium", "high"]);
export type Priority = z.infer<typeof Priority>;

export const AiProvider = z.enum(["openrouter", "openai", "none"]);
export type AiProvider = z.infer<typeof AiProvider>;
