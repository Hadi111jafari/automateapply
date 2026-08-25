'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useProfile } from '@/lib/use-profile';
import { ComingSoon } from './coming-soon';

const sections = [
  'Profile',
  'Search preferences',
  'Auto-apply rules',
  'Integrations',
  'Billing & plan',
  'Privacy',
];
function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="panel scroll-mt-28 p-5 sm:p-7">
      <h2 className="display text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  );
}
function Row({
  name,
  desc,
  children,
}: {
  name: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#302b25] py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="min-w-0 sm:max-w-[420px]">{children}</div>
    </div>
  );
}
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      aria-pressed={value}
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-[#e48816] shadow-[0_0_15px_rgba(235,137,22,.35)]' : 'bg-[#4a443c]'}`}
    >
      <span
        className={`absolute top-1 size-4 rounded-full bg-[#e9ddcd] transition ${value ? 'right-1' : 'left-1'}`}
      />
    </button>
  );
}

export function Settings() {
  const { demoMode, profile: savedProfile, email, setProfile: setSavedProfile } = useProfile();
  const [stealthOverride, setStealthOverride] = useState<boolean | null>(null);
  const [anonymousOverride, setAnonymousOverride] = useState<boolean | null>(null);
  const [thresholdOverride, setThresholdOverride] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [profile, setProfile] = useState({ fullName: '', headline: '', phone: '', linkedin: '', currentEmployer: '', targetRoles: '', locations: '', minimumSalary: '' });
  const [searchDraft, setSearchDraft] = useState({ targetRoles: '', locations: '', minimumSalary: '' });
  const shownName = demoMode ? 'Sarah Chen' : savedProfile?.full_name || email || 'Complete your profile';
  const shownHeadline = demoMode ? 'Senior Product Manager · San Francisco · $180k+' : savedProfile?.headline || 'Add your target role in Edit profile';
  const stealth = demoMode ? true : stealthOverride ?? savedProfile?.stealth ?? true;
  const anonymous = demoMode ? false : anonymousOverride ?? savedProfile?.anonymous_applications ?? false;
  const threshold = demoMode ? 90 : thresholdOverride ?? savedProfile?.auto_apply_threshold ?? 90;
  const searchValues = demoMode
    ? { targetRoles: 'Senior Product Manager, Director of Product', locations: 'Remote (US), San Francisco, New York', minimumSalary: '$180,000' }
    : { targetRoles: searchDraft.targetRoles || savedProfile?.target_roles.join(', ') || '', locations: searchDraft.locations || savedProfile?.locations.join(', ') || '', minimumSalary: searchDraft.minimumSalary || (savedProfile?.minimum_salary ? `$${savedProfile.minimum_salary.toLocaleString()}` : '') };
  const persist = async (overrides: Partial<typeof profile> = {}, preferenceOverrides: Partial<{ stealth: boolean; anonymous: boolean; threshold: number }> = {}) => {
    if (demoMode) return;
    const current = { fullName: savedProfile?.full_name ?? email.split('@')[0] ?? '', headline: savedProfile?.headline ?? '', phone: savedProfile?.phone ?? '', linkedin: savedProfile?.linkedin ?? '', currentEmployer: savedProfile?.current_employer ?? '', targetRoles: savedProfile?.target_roles.join(', ') ?? '', locations: savedProfile?.locations.join(', ') ?? '', minimumSalary: savedProfile?.minimum_salary?.toString() ?? '', ...overrides };
    const preferences = { stealth, anonymous, threshold, ...preferenceOverrides };
    const result = await apiFetch<{ profile: NonNullable<typeof savedProfile> }>('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: current.fullName, headline: current.headline, phone: current.phone, linkedin: current.linkedin, currentEmployer: current.currentEmployer, targetRoles: current.targetRoles.split(',').map((item) => item.trim()).filter(Boolean), locations: current.locations.split(',').map((item) => item.trim()).filter(Boolean), minimumSalary: current.minimumSalary ? Number(current.minimumSalary.replace(/[^0-9]/g, '')) : null, autoApplyThreshold: preferences.threshold, stealth: preferences.stealth, anonymousApplications: preferences.anonymous }) });
    setSavedProfile(result.profile);
  };
  const saveProfile = async () => {
    if (!profile.fullName.trim()) { setProfileError('Name is required.'); return; }
    setSaving(true); setProfileError(undefined);
    try {
      if (demoMode) { setEditing(false); return; }
      await persist({ ...profile, targetRoles: savedProfile?.target_roles.join(', ') ?? '', locations: savedProfile?.locations.join(', ') ?? '', minimumSalary: savedProfile?.minimum_salary?.toString() ?? '' });
      setEditing(false);
    } catch (cause) { setProfileError(cause instanceof Error ? cause.message : 'Could not save profile.'); }
    finally { setSaving(false); }
  };
  return (
    <div className="mx-auto grid max-w-[1160px] gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
      <nav
        aria-label="Settings sections"
        className="panel flex h-fit gap-1 overflow-x-auto p-2 lg:sticky lg:top-[106px] lg:flex-col"
      >
        {sections.map((section, index) => (
          <a
            key={section}
            href={`#${['profile', 'search', 'autoapply', 'integrations', 'billing', 'privacy'][index]}`}
            className={`shrink-0 rounded-lg px-3 py-2.5 text-sm transition ${index === 0 ? 'bg-[#30251a] text-[#f3a133]' : 'text-muted-foreground hover:bg-[#25221e] hover:text-[#f4eadf]'}`}
          >
            {section}
          </a>
        ))}
      </nav>
      <div className="min-w-0 space-y-5">
        <Section
          id="profile"
          title="Profile"
          subtitle="The basics AutomateApply uses to find and apply to roles"
        >
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="grid size-[72px] place-items-center rounded-full bg-gradient-to-br from-[#ffbe65] to-[#b45a02] text-2xl font-bold text-black">
              SC
            </div>
            <div className="min-w-[220px] flex-1">
              <h3 className="display text-2xl font-bold">{shownName}</h3>
              <p className="text-sm text-muted-foreground">
                {shownHeadline}
              </p>
              <span className="pill green mt-2">Visible to recruiters</span>{' '}
              <span className="pill">Public profile</span>
            </div>
            <button onClick={() => { setProfile({ fullName: savedProfile?.full_name ?? '', headline: savedProfile?.headline ?? '', phone: savedProfile?.phone ?? '', linkedin: savedProfile?.linkedin ?? '', currentEmployer: savedProfile?.current_employer ?? '', targetRoles: '', locations: '', minimumSalary: '' }); setEditing(true); }} className="ghost-button px-4 py-2 text-sm">Edit</button>
          </div>
          <div className="mt-5">
            {[
              [
                'Email',
                'Used for job alerts and recruiter replies',
                demoMode ? 'sarah.chen@gmail.com' : email || 'No email available',
              ],
              ['Phone', 'For interview SMS reminders', demoMode ? '+1 (415) 555-0182' : savedProfile?.phone || 'Not set'],
              [
                'LinkedIn',
                'Used to enrich your profile',
                demoMode ? 'linkedin.com/in/sarahchen' : savedProfile?.linkedin || 'Not set',
              ],
              [
                'Current employer',
                'Hidden from your search by default',
                demoMode ? 'Klarna · stealth on' : savedProfile?.current_employer || 'Not set',
              ],
            ].map(([name, desc, value]) => (
              <Row key={name} name={name} desc={desc}>
                <span className="text-sm text-[#cbbba8]">{value}</span>
              </Row>
            ))}
          </div>
        </Section>
        <Section
          id="search"
          title="Search preferences"
          subtitle="What AutomateApply looks for every day"
        >
          <div className="mt-5">
            <Row
              name="Target roles"
              desc="Comma-separated. AI matches against these."
            >
              <input
                className="w-full rounded-xl border border-border bg-[#1a1815] px-4 py-2 text-sm"
                value={searchValues.targetRoles}
                onChange={(event) => setSearchDraft((current) => ({ ...current, targetRoles: event.target.value }))}
                disabled={demoMode}
              />
            </Row>
            <Row name="Locations" desc="“Remote US” = anywhere in the US">
              <input
                className="w-full rounded-xl border border-border bg-[#1a1815] px-4 py-2 text-sm"
                value={searchValues.locations}
                onChange={(event) => setSearchDraft((current) => ({ ...current, locations: event.target.value }))}
                placeholder="Remote (US), San Francisco"
                disabled={demoMode}
              />
            </Row>
            <Row
              name="Minimum base salary"
              desc="Roles below this are filtered out"
            >
              <input
                className="w-32 rounded-xl border border-border bg-[#1a1815] px-4 py-2"
                value={searchValues.minimumSalary}
                onChange={(event) => setSearchDraft((current) => ({ ...current, minimumSalary: event.target.value }))}
                disabled={demoMode}
              />
            </Row>
            <Row name="Deal-breakers" desc="Skip any job matching these">
              <div className="flex flex-wrap gap-2">
                <span className="pill red">Recruiting agencies</span>
                <span className="pill red">Series A</span>
                <span className="pill red">On-call</span>
              </div>
            </Row>
            {!demoMode && <button type="button" onClick={() => { void persist(searchValues).then(() => { setSearchDraft({ targetRoles: '', locations: '', minimumSalary: '' }); setNotice('Search preferences saved.'); }).catch((cause: unknown) => setProfileError(cause instanceof Error ? cause.message : 'Could not save preferences.')); }} className="amber-button mt-5 px-4 py-2 text-sm">Save search preferences</button>}
          </div>
        </Section>
        <ComingSoon><Section
          id="autoapply"
          title="Auto-apply rules"
          subtitle="How AutomateApply decides when to apply, and when to ask you"
        >
          <div className="mt-5">
            <Row
              name="Run schedule"
              desc="When AutomateApply is allowed to auto-apply"
            >
              <div className="flex w-fit rounded-full border border-border bg-[#171512] p-1 text-sm">
                <span className="px-3 py-2 text-muted-foreground">Paused</span>
                <span className="rounded-full bg-[#332f2a] px-3 py-2">
                  Daily 3–6 AM
                </span>
                <span className="px-3 py-2 text-muted-foreground">
                  Continuous
                </span>
              </div>
            </Row>
            <Row
              name="Auto-apply threshold"
              desc="Auto-send if match score is above this"
            >
              <div className="w-full sm:w-52">
                <input
                  aria-label="Auto-apply threshold"
                  value={threshold}
                  onChange={(event) => setThresholdOverride(Number(event.target.value))}
                  type="range"
                  min="0"
                  max="100"
                  className="w-full accent-[#e68716]"
                />
                <p className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <b className="text-[#e9a43c]">{threshold}%+</b>
                  <span>100%</span>
                </p>
              </div>
            </Row>
            <Row
              name="Hold for review when"
              desc="AutomateApply pauses for your approval"
            >
              <label className="block text-sm leading-7">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mr-2 accent-[#e68716]"
                />
                Custom questions on application
                <br />
                <input
                  type="checkbox"
                  defaultChecked
                  className="mr-2 accent-[#e68716]"
                />
                Salary not listed
                <br />
                <input type="checkbox" className="mr-2 accent-[#e68716]" />
                Match below 90%
              </label>
            </Row>
          </div>
        </Section></ComingSoon>
        <Section
          id="integrations"
          title="Integrations"
          subtitle="Connect AutomateApply to your existing tools"
        >
          <ComingSoon><div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ['in', 'LinkedIn', 'Auto-import profile · 2 days ago', true],
              ['G', 'Gmail', 'sarah.chen@gmail.com', true],
              ['O', 'Outlook', 'Not connected', false],
              [
                'C',
                'Google Calendar',
                'Interview scheduling · 2-way sync',
                true,
              ],
              ['D', 'Discord', 'Notifications', false],
              ['S', 'Slack', 'Not connected', false],
            ].map(([icon, name, detail, connected]) => (
              <div
                className="flex items-center gap-3 rounded-xl border border-[#2a2722] p-4"
                key={String(name)}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-[#156bc4] font-bold">
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {detail}
                  </p>
                </div>
                <button
                  className={
                    connected ? 'pill green' : 'ghost-button px-3 py-2 text-sm'
                  }
                >
                  {connected ? 'Connected' : 'Connect'}
                </button>
              </div>
            ))}
          </div></ComingSoon>
        </Section>
        <Section
          id="billing"
          title="Billing & plan"
          subtitle="You’re on Pro · $79/mo · renews Apr 14"
        >
          <ComingSoon><div className="mt-5">
            {[
              ['Applications', '147 of unlimited · resets Apr 1'],
              ['Interview copilot', '2 of 10 sessions'],
              ['Resume tailoring', 'Unlimited'],
            ].map(([name, desc]) => (
              <Row key={name} name={name} desc={desc}>
                <span className="pill green">
                  {name === 'Resume tailoring' ? '∞' : 'Active'}
                </span>
              </Row>
            ))}
          </div></ComingSoon>
        </Section>
        <Section
          id="privacy"
          title="Privacy"
          subtitle="Your data, your control"
        >
          <div className="mt-5">
            <Row
              name="Stealth mode"
              desc="Hide your profile and activity from your current employer"
            >
              <Toggle value={stealth} onChange={() => { const value = !stealth; setStealthOverride(value); void persist({}, { stealth: value }).then(() => setNotice('Privacy preference saved.')).catch((cause: unknown) => setProfileError(cause instanceof Error ? cause.message : 'Could not save privacy preference.')); }} />
            </Row>
            <Row
              name="Anonymized applications"
              desc="Strip name and photo from submitted resumes"
            >
              <Toggle
                value={anonymous}
                onChange={() => { const value = !anonymous; setAnonymousOverride(value); void persist({}, { anonymous: value }).then(() => setNotice('Privacy preference saved.')).catch((cause: unknown) => setProfileError(cause instanceof Error ? cause.message : 'Could not save privacy preference.')); }}
              />
            </Row>
            <Row
              name="Export your data"
              desc="Download everything we have on you"
            >
              <button className="ghost-button px-4 py-2 text-sm">
                Request export
              </button>
            </Row>
            <Row
              name="Delete account"
              desc="Permanently remove your account and all data"
            >
              <button className="text-sm text-red-400">Delete</button>
            </Row>
          </div>
        </Section>
      </div>
      {(profileError || notice) && <p className={`fixed bottom-5 right-5 z-[120] rounded-xl px-4 py-3 text-sm shadow-xl ${profileError ? 'bg-red-950 text-red-200' : 'bg-emerald-950 text-emerald-200'}`}>{profileError || notice}</p>}
      {editing && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4"><div className="panel w-full max-w-xl p-6"><div className="flex items-center justify-between"><h2 className="display text-2xl font-bold">Edit profile</h2><button onClick={() => setEditing(false)} className="text-muted-foreground">Close</button></div><p className="mt-1 text-sm text-muted-foreground">Manage roles, locations, and salary in Search preferences.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{([['fullName','Name'], ['headline','Headline'], ['phone','Phone'], ['linkedin','LinkedIn'], ['currentEmployer','Current employer']] as const).map(([key, label]) => <label key={key} className="text-sm sm:col-span-1">{label}<input value={profile[key]} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-[#1a1815] px-3 py-2" /></label>)}</div>{profileError && <p className="mt-3 text-sm text-red-400">{profileError}</p>}<div className="mt-6 flex justify-end gap-2"><button onClick={() => setEditing(false)} className="ghost-button px-4 py-2 text-sm">Cancel</button><button onClick={() => void saveProfile()} disabled={saving} className="amber-button px-4 py-2 text-sm">{saving ? 'Saving…' : 'Save profile'}</button></div></div></div>}
    </div>
  );
}
