import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0a0908] px-5">
      <div className="w-full">
        <Link href="/" className="mb-8 flex justify-center gap-2 text-lg">
          <span className="grid size-6 place-items-center rounded-full bg-[#ed921e] text-black">
            ◉
          </span>
          <span className="display font-bold">AutomateApply</span>
        </Link>
        <AuthForm />
      </div>
    </main>
  );
}
