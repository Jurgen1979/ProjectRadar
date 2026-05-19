import type { ProjectMeta } from "@/lib/schema/meta";

export type ProjectWarning = {
  level: "info" | "warning" | "error";
  file: string;
  message: string;
};

export type ProjectStatusFile = {
  title: string | null;
  korteStatus: string | null;
  dashboardzin: string | null;
  huidigeFase: string | null;
  laatsteBelangrijkeBeslissing: string | null;
  volgendeActie: string | null;
  wachtOp: string | null;
  openVragen: string[];
  risicos: string[];
  belangrijkeContext: string[];
  laatstBijgewerkt: string | null;
  raw: string;
  unknownSections: Array<{ heading: string; body: string }>;
};

export type ProjectLinkGroup = {
  heading: string;
  key: string;
  links: Array<{ label: string; url: string | null }>;
};

export type ProjectLinksFile = {
  title: string | null;
  groups: ProjectLinkGroup[];
  raw: string;
};

export type LogEntry = {
  date: string | null;
  heading: string;
  body: string;
};

export type ProjectLogFile = {
  title: string | null;
  entries: LogEntry[];
  raw: string;
};

export type DecisionEntry = {
  date: string | null;
  title: string;
  decision: string | null;
  why: string | null;
  impact: string | null;
  revise: string | null;
  raw: string;
};

export type DecisionLogFile = {
  title: string | null;
  entries: DecisionEntry[];
  raw: string;
};

export type UpdateFile = {
  filename: string;
  /** Filesystem mtime — used for "recent updates" sorting when datum is missing. */
  mtime: number;
  title: string | null;
  datum: string | null;
  bron: string | null;
  korteContext: string | null;
  beslissingen: string[];
  argumentatie: string[];
  openVragen: string[];
  volgendeActies: string[];
  risicos: string[];
  belangrijkeOutputs: string[];
  dashboardzin: string | null;
  raw: string;
};

export type Project = {
  slug: string;
  dir: string;
  meta: ProjectMeta;
  status: ProjectStatusFile | null;
  links: ProjectLinksFile | null;
  log: ProjectLogFile | null;
  decisions: DecisionLogFile | null;
  updates: UpdateFile[];
  sources: string[];
  warnings: ProjectWarning[];
};
