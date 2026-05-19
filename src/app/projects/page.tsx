import { getConfigStatus } from "@/lib/config";
import { loadDashboardData } from "@/lib/projects/dashboard-data";
import { ProjectsDashboard } from "@/components/projects/dashboard";
import { BrokenProjectsList } from "@/components/projects/broken-list";
import { NoProjectsState, NoRootState } from "@/components/projects/empty-state";

export default async function ProjectsPage() {
  const status = getConfigStatus();

  if (status.kind !== "ok") {
    return <NoRootState message={status.message} />;
  }

  const data = await loadDashboardData(status.root, status.config);

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
