import { redirect } from 'next/navigation';
import { Dashboard } from '@/components/workspace/dashboard';
import { WorkspacePage } from '@/components/workspace/workspace-shell';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
export default async function Page() {
  const access = await requireWorkspaceAccess();
  if (!access.demo && !access.onboardingCompleted) redirect('/settings');
  return (
    <WorkspacePage demo={access.demo}>
      <Dashboard initialDemo={access.demo} />
    </WorkspacePage>
  );
}
