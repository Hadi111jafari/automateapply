import { Settings } from '@/components/workspace/settings';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  const access = await requireWorkspaceAccess();
  return (
    <WorkspacePage demo={access.demo}>
      <Settings initialDemo={access.demo} />
    </WorkspacePage>
  );
}
