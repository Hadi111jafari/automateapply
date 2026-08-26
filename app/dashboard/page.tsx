import { Dashboard } from '@/components/workspace/dashboard';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  await requireWorkspaceAccess();
  return (
    <WorkspacePage>
      <Dashboard />
    </WorkspacePage>
  );
}
