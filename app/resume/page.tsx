import { Resume } from '@/components/workspace/resume';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  const access = await requireWorkspaceAccess();
  return (
    <WorkspacePage demo={access.demo}>
      <Resume initialDemo={access.demo} />
    </WorkspacePage>
  );
}
