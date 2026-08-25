import { Interview } from '@/components/workspace/interview';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  await requireWorkspaceAccess();
  return (
    <WorkspacePage>
      <Interview />
    </WorkspacePage>
  );
}
