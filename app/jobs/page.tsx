import { Jobs } from '@/components/workspace/jobs';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  const access = await requireWorkspaceAccess();
  return (
    <WorkspacePage demo={access.demo}>
      <Jobs initialDemo={access.demo} />
    </WorkspacePage>
  );
}
