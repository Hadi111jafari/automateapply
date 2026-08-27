import { Interview } from '@/components/workspace/interview';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  const access = await requireWorkspaceAccess();
  return (
    <WorkspacePage demo={access.demo}>
      <Interview initialDemo={access.demo} />
    </WorkspacePage>
  );
}
