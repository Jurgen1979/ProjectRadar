import { getConfigStatus } from "@/lib/config";
import { loadDashboardData } from "@/lib/projects/dashboard-data";
import { serverFsIO } from "@/lib/server-io";
import { ProjectsDashboard } from "@/components/projects/dashboard";
import { BrokenProjectsList } from "@/components/projects/broken-list";
import { NoProjectsState, NoRootState } from "@/components/projects/empty-state";
import { TauriOnly, WebOnly } from "@/components/web-only";
import { TauriDashboard } from "./_tauri-dashboard";

export default async function ProjectsPage() {
  return (
    <>
      <TauriOnly>
        <TauriDashboard />
      </TauriOnly>
      <WebOnly>
        <WebDashboard />
      </WebOnly>
    </>
  );
}

async function WebDashboard() {
  const status = getConfigStatus();

  if (status.kind !== "ok") {
    return <NoRootState message={status.message} />;
  }

  const data = await loadDashboardData(serverFsIO, status.root, status.config);

  if (data.cards.length === 0 && data.broken.length === 0) {
    return <NoProjectsState root={status.root} />;
  }

  return (
    <div className="space-y-6">
      <ProjectsDashboard data={data} />
      <BrokenProjectsList broken={data.broken} skipped={data.skipped} />
    </div>
  );
}
