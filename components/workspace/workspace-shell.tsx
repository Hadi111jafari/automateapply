'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BriefcaseBusiness,
  ChartNoAxesColumn,
  Download,
  FileText,
  Grid2X2,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { apiFetch } from '@/lib/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { endDemoMode, useDemoMode } from '@/lib/demo-mode';
import { useProfile } from '@/lib/use-profile';

type SidebarItem = {
  href: string;
  label: string;
  icon: typeof Grid2X2;
  count?: string;
  disabled?: boolean;
};

type ShellApplication = {
  id: string;
  company: string;
  title: string;
  stage: string;
  match_score: number | null;
  location: string;
  source_url: string;
  created_at: string;
  updated_at: string;
};

const workspaceItems: SidebarItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid2X2, count: '7' },
  { href: '/jobs', label: 'Job Search', icon: BriefcaseBusiness, count: '147' },
  { href: '/applications', label: 'Applications', icon: FileText, count: '12' },
  { href: '/resume', label: 'Resume & AI', icon: FileText },
  { href: '/interview', label: 'Interview', icon: Mic, count: '2' },
];
// Non-core destinations stay visible for design fidelity but are disabled
// until their features ship. They render grayed out with a "Coming soon"
// tooltip instead of pretending to work.
const insightItems: SidebarItem[] = [
  { href: '#market-intel', label: 'Market Intel', icon: ChartNoAxesColumn, disabled: true },
  { href: '#messages', label: 'Messages', icon: MessageSquare, count: '5', disabled: true },
];
const settingsItems: SidebarItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];
const routeItems = [...workspaceItems, settingsItems[0]];
const sidebarPreferenceEvent = 'automateapply-sidebar-preference';

export function initialsOf(name: string, fallbackEmail = '') {
  const source = name.trim() || fallbackEmail.split('@')[0] || '';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return 'AA';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function subscribeToSidebarPreference(onStoreChange: () => void) {
  window.addEventListener(sidebarPreferenceEvent, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(sidebarPreferenceEvent, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function getSidebarPreference() {
  return (
    window.localStorage.getItem('automateapply-sidebar-collapsed') !== 'false'
  );
}

function BrandMark() {
  return (
    <div className="relative size-[30px] shrink-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fcd28a_0%,#e89438_30%,#b85e0e_70%,#5a2e08_100%)] shadow-[0_0_24px_rgba(232,148,56,.55),inset_0_2px_0_rgba(255,220,170,.4),inset_0_-2px_0_rgba(0,0,0,.3)]">
      <span className="absolute inset-2 rounded-full border-[1.5px] border-[rgba(26,18,8,.7)]" />
      <span className="absolute inset-[14px] rounded-full bg-[#0a0807] shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]" />
    </div>
  );
}

function SidebarSection({
  title,
  items,
  collapsed,
  pathname,
  onNavigate,
}: {
  title: string;
  items: SidebarItem[];
  collapsed: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <section className="w-full">
      <p className="mb-1 mt-1 flex items-center px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#6a5b4a] md:justify-start md:px-3">
        <span className="md:hidden">{title}</span>
        <span className="hidden md:block">{collapsed ? title[0] : title}</span>
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const selected =
            item.href === '/settings'
              ? pathname.startsWith('/settings')
              : item.href.startsWith('/') && pathname.startsWith(item.href);
          const Icon = item.icon;
          const itemContent = (
            <>
              <Icon size={18} strokeWidth={1.8} />
              <span
                className={`min-w-0 overflow-hidden whitespace-nowrap text-[13px] font-medium uppercase tracking-[.06em] transition-[max-width,opacity] duration-300 ${collapsed ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[150px] md:opacity-100'}`}
              >
                {item.label}
              </span>
              {item.count && !item.disabled ? (
                <span
                  className={`ml-auto grid h-[18px] min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[10px] font-semibold leading-none ${selected ? 'bg-[linear-gradient(180deg,#e89438,#b85e0e)] text-[#1a1208] shadow-[0_0_8px_rgba(232,148,56,.55)]' : 'bg-[#252220] text-[#d6c5ad]'} ${collapsed ? 'md:absolute md:right-1 md:top-1 md:ml-0' : 'md:static'}`}
                >
                  {item.count}
                </span>
              ) : null}
            </>
          );
          const stateClassName = item.disabled
            ? 'text-[#5f564b]'
            : selected
              ? 'bg-[#1a1815] bg-[linear-gradient(90deg,rgba(232,148,56,.18),rgba(232,148,56,.04))] text-[#faf3e8] shadow-[inset_2px_0_0_#d97a1e,inset_0_0_0_1px_rgba(232,148,56,.2),0_0_16px_rgba(232,148,56,.18)]'
              : 'text-[#948370] hover:bg-[#252220] hover:text-[#faf3e8]';
          const className = `relative flex h-[45px] w-full items-center gap-3 overflow-hidden rounded-[12px] px-3 py-[10px] text-[13px] font-medium leading-[20px] tracking-[-.005em] transition-[background,color,box-shadow] duration-200 ${collapsed ? 'md:justify-start md:px-3' : 'md:justify-start'} ${stateClassName}`;

          if (item.href.startsWith('/')) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={selected ? 'page' : undefined}
                className={className}
              >
                {itemContent}
              </Link>
            );
          }

          return (
            <button
              key={item.href}
              type="button"
              disabled={item.disabled}
              title={item.disabled ? 'Coming soon' : collapsed ? item.label : undefined}
              onClick={onNavigate}
              className={className}
            >
              {itemContent}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const demoMode = useDemoMode();
  const { profile, email } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quickJobQuery, setQuickJobQuery] = useState('');
  const [applications, setApplications] = useState<ShellApplication[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Real badge counts for real accounts; the amber demo keeps its static numbers.
  useEffect(() => {
    if (demoMode) return;
    let alive = true;
    apiFetch<{ applications: ShellApplication[] }>('/api/applications')
      .then((data) => {
        if (alive) setApplications(data.applications);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [demoMode]);

  // ⌘K / Ctrl+K focuses the quick search, matching the visible hint.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const realCounts: Record<string, number> = {
    '/dashboard': applications.filter((app) => app.stage === 'review').length,
    '/jobs': applications.length,
    '/applications': applications.filter(
      (app) => !['review', 'rejected'].includes(app.stage),
    ).length,
    '/interview': applications.filter((app) =>
      ['screen', 'technical', 'final', 'offer'].includes(app.stage),
    ).length,
  };
  const visibleWorkspaceItems = workspaceItems.map((item) => ({
    ...item,
    count: demoMode
      ? item.count
      : realCounts[item.href] > 0
        ? String(realCounts[item.href])
        : undefined,
  }));
  const exportApplicationsCsv = () => {
    if (!applications.length) return;
    const escapeCell = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = applications.map((app) =>
      [
        app.company,
        app.title,
        app.stage,
        app.match_score ?? '',
        app.location,
        app.created_at,
        app.updated_at,
        app.source_url,
      ]
        .map(escapeCell)
        .join(','),
    );
    const csv = [
      'Company,Role,Stage,Match,Location,Saved,Updated,Listing URL',
      ...rows,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'automateapply-applications.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  const collapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreference,
    () => true,
  );
  const toggleSidebar = () => {
    window.localStorage.setItem(
      'automateapply-sidebar-collapsed',
      String(!collapsed),
    );
    window.dispatchEvent(new Event(sidebarPreferenceEvent));
  };
  const signOut = async () => {
    await getSupabaseBrowserClient()?.auth.signOut();
    await endDemoMode();
    window.location.assign('/login');
  };
  const active =
    routeItems.find((item) => pathname.startsWith(item.href)) ?? workspaceItems[0];
  const title =
    active.label === 'Job Search'
      ? 'Find your next role'
      : active.label === 'Applications'
        ? demoMode ? '89 applications · 12 in motion' : 'Track your application pipeline'
        : active.label === 'Resume & AI'
          ? demoMode ? 'Tailored for Stripe · Sr. PM, Growth' : 'Build your tailored application'
          : active.label === 'Interview'
            ? demoMode ? 'Stripe · Recruiter screen · Tomorrow 10:00 AM' : 'Prepare with confidence'
            : active.label === 'Dashboard'
              ? demoMode ? 'Good afternoon, Sarah' : `Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`
              : 'Settings';
  return (
    <div className="min-h-screen overflow-x-clip bg-[#0a0807] text-[#faf3e8]">
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 grid size-10 place-items-center rounded-lg border border-border bg-card md:hidden"
      >
        <Menu size={19} />
      </button>
      {open && (
        <button
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/65 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(248px,calc(100vw-2rem))] flex-col gap-5 overflow-x-hidden overflow-y-auto border-r border-[rgba(255,220,170,.06)] bg-[linear-gradient(180deg,#11100e,#0a0807)] px-3.5 py-[22px] transition-[transform,width] duration-300 ease-out md:translate-x-0 md:px-3.5 ${collapsed ? 'md:w-[88px] md:px-2' : 'md:w-[248px]'} ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex w-full items-center gap-3 border-b border-[rgba(255,220,170,.06)] px-3 pb-4 pt-1 mb-1 ${collapsed ? 'md:justify-center md:gap-0 md:px-0' : ''}`}
        >
          <BrandMark />
          <span
            className={`display whitespace-nowrap text-xl font-semibold italic ${collapsed ? 'md:hidden' : ''}`}
          >
            AutomateApply
          </span>
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="ml-auto hidden size-6 shrink-0 place-items-center rounded-full border border-[#484038] bg-[#211e1a] text-[#cbb9a3] shadow-lg transition hover:text-[#f3a133] md:grid md:size-6"
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
          <button onClick={() => setOpen(false)} className="ml-auto md:hidden">
            <X />
          </button>
        </div>
        <nav aria-label="Workspace navigation" className="flex w-full flex-col gap-5">
          <SidebarSection title="Workspace" items={visibleWorkspaceItems} collapsed={collapsed} pathname={pathname} onNavigate={() => setOpen(false)} />
          <SidebarSection title="Insights" items={insightItems} collapsed={collapsed} pathname={pathname} onNavigate={() => setOpen(false)} />
          <SidebarSection title="Settings" items={settingsItems} collapsed={collapsed} pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="mt-auto w-full shrink-0 rounded-[12px] border border-[rgba(255,220,170,.06)] bg-[#1a1815] p-2.5">
          <div className={`flex min-w-0 items-center gap-2.5 ${collapsed ? 'md:gap-1 md:p-0' : ''}`}>
            <div className={`grid shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#f4b35a,#b85e0e_60%,#5a2e08)] font-bold text-[#1a1208] ${collapsed ? 'md:size-7 md:text-[10px]' : 'size-9 text-xs'}`}>
              {demoMode ? 'SC' : initialsOf(profile?.full_name ?? '', email)}
            </div>
            <div className={`min-w-0 flex-1 leading-[1.25] ${collapsed ? 'md:hidden' : ''}`}>
              <p className="truncate text-[13px] font-medium text-[#faf3e8]">{demoMode ? 'Sarah Chen' : profile?.full_name || email || 'Complete your profile'}</p>
              <p className="mt-px truncate text-[11px] text-[#948370]">{demoMode ? 'Demo workspace' : profile?.headline || 'Personal workspace'}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Log out"
              title="Log out"
              className={`grid shrink-0 place-items-center text-[#948370] transition-colors hover:text-[#faf3e8] ${collapsed ? 'md:size-4' : 'size-6'}`}
            >
              <LogOut size={collapsed ? 14 : 16} />
            </button>
          </div>
        </div>
      </aside>
      <main
        className={`min-w-0 transition-[margin] duration-300 ${collapsed ? 'md:ml-[88px]' : 'md:ml-[248px]'}`}
      >
        <header className="sticky top-0 z-30 flex min-h-[90px] items-center justify-between border-b border-[#24211d] bg-[#0d0c0b]/95 px-5 py-4 backdrop-blur md:px-9">
          <div className="ml-12 md:ml-0">
            <p className="mb-1 text-xs text-[#9d8d7b]">
              Workspace <span className="px-2 text-[#62594e]">/</span>{' '}
              <span className="text-[#d8ccc0]">{active.label}</span>
            </p>
            <h1 className="display max-w-[650px] text-[25px] font-bold leading-tight md:text-[28px]">
              {title}
            </h1>
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            <form aria-label="Quick job search" title="Quick job search opens Job Search with this keyword." className="workspace-search flex h-10 w-[300px] items-center gap-3 rounded-full border bg-[#1a1816] px-4 text-[#8d8276]" onSubmit={(event) => { event.preventDefault(); const query = quickJobQuery.trim(); router.push(query ? `/jobs?q=${encodeURIComponent(query)}` : '/jobs'); }}>
              <Search size={16} />
              <input
                ref={searchInputRef}
                value={quickJobQuery}
                onChange={(event) => setQuickJobQuery(event.target.value)}
                aria-label="Quick job search"
                placeholder="Quick job search…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#746b61]"
              />
              <kbd className="rounded border border-[#474139] px-1.5 py-0.5 text-[10px]">
                ⌘K
              </kbd>
            </form>
            <button
              aria-label="Notifications (coming soon)"
              title="Coming soon"
              disabled
              className="relative grid size-10 place-items-center rounded-xl bg-[#191714] text-[#d8c7b4]"
            >
              <Bell size={19} />
            </button>
            {active.label === 'Applications' ? (
              <button
                type="button"
                onClick={exportApplicationsCsv}
                disabled={!applications.length}
                title={applications.length ? 'Download your applications as CSV' : 'Nothing to export yet'}
                className="ghost-button flex h-10 items-center gap-2 px-5 text-sm"
              >
                <Upload size={16} /> Export CSV
              </button>
            ) : active.label === 'Resume & AI' ? (
              // PDF export needs a document renderer; disabled until it ships.
              <button
                type="button"
                disabled
                title="Coming soon"
                className="ghost-button flex h-10 items-center gap-2 px-5 text-sm"
              >
                <Download size={16} /> Download PDF
              </button>
            ) : active.label === 'Job Search' || active.label === 'Dashboard' ? (
              <Link
                href="/jobs"
                className="amber-button flex h-10 items-center gap-2 px-5 text-sm"
              >
                <span className="text-lg">+</span> New search
              </Link>
            ) : null}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function WorkspacePage({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceShell>
      <div className="mx-auto  px-4 py-8 md:px-9">{children}</div> 
    </WorkspaceShell> //removed max-w-[1320px] after mx-auto class and got fixed the extra space around content in dashboard
  );
} 
export function MiniTrend({
  color = '#e99728',
  points = '0,24 20,22 31,16 42,18 56,10 70,8 88,2',
}: {
  color?: string;
  points?: string;
}) {
  return (
    <svg viewBox="0 0 120 40" className="h-8 w-20" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function TinyCompany({
  letter,
  tone = 'violet',
}: {
  letter: string;
  tone?: 'violet' | 'orange' | 'black' | 'coral' | 'blue';
}) {
  const colors = {
    violet: 'from-[#6562ff] to-[#4849dc]',
    orange: 'from-[#f1972e] to-[#cf6710]',
    black: 'from-[#101010] to-[#414141]',
    coral: 'from-[#e77957] to-[#bc5038]',
    blue: 'from-[#4b86ed] to-[#2458b5]',
  };
  return (
    <span
      className={`grid size-[52px] shrink-0 place-items-center rounded-xl bg-gradient-to-br ${colors[tone]} text-base font-medium text-white shadow-lg`}
    >
      {letter}
    </span>
  );
}
