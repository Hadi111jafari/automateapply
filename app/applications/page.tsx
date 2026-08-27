import { Applications } from '@/components/workspace/applications';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  const access = await requireWorkspaceAccess();
  return (
    <WorkspacePage demo={access.demo}>
      <Applications initialDemo={access.demo} />
    </WorkspacePage>
  );
}
