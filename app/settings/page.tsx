import { Settings } from '@/components/workspace/settings';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  await requireWorkspaceAccess();
  return (
    <WorkspacePage>
      <Settings />
    </WorkspacePage>
  );
}
