"use client";

import { ChevronDown, Play, Volume2 } from "lucide-react";
import { useState } from "react";
import { TinyCompany } from "./workspace-shell";
import { ComingSoon } from './coming-soon';
import { useDemoMode } from '@/lib/demo-mode';

const questions = [
  ["Walk me through a time you drove a metric that mattered to the business.", "Open with Klarna SMB activation (47% conversion). Frame the metric, the experiments, the result, and the lesson. Keep it to 90 seconds.", "Prepared"],
  ["Why Stripe? Why Growth specifically?", "Mention the Atlas PLG shift. Their recent post on developer experience caught your eye. Connect your payment-tools background to where they are headed.", "Prepared"],
  ["Tell me about a product you killed and why.", "Use the Notion Workflows v1 case study. Data showed 4% adoption; you stopped feature work and learned to instrument earlier.", "Prepared"],
  ["How do you handle conflict with engineering on prioritization?", "Use the Klarna fraud-versus-growth debate. You settled it with a shared OKR, not another meeting.", "Needs polish"],
  ["What’s your biggest weakness as a PM?", "I over-index on quantitative signals early. I now schedule three customer calls before any data-driven decision.", "Prepared"],
] as const;

const upcoming = [
  ["S", "Stripe · Recruiter screen", "Sarah Patel · 30 min", "Tomorrow", "Tuesday · 10:00 AM · Zoom"],
  ["L", "Linear · Hiring manager", "Tuomas Artman · 45 min", "Prep 60%", "Thursday · 11:30 AM"],
  ["V", "Vercel · Onsite (final)", "5 rounds · SF or remote", "Onsite", "Monday · 9:00 AM"],
] as const;

export function Interview({ initialDemo = false }: { initialDemo?: boolean }) {
  const demoMode = useDemoMode() || initialDemo;
  const [listening, setListening] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [showPlaybook, setShowPlaybook] = useState(true);
  const question = questions[activeQuestion];

  if (!demoMode) return <section className="panel grid min-h-[420px] place-items-center p-8 text-center"><div><h2 className="display text-3xl font-bold">Interview preparation</h2><p className="mt-3 text-sm text-muted-foreground">Coming soon</p></div></section>;
  return (
    <ComingSoon><section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(300px,.78fr)]">
      <div className="min-w-0 space-y-5">
        <section className="rounded-[20px] border-2 border-[#d8780e] bg-gradient-to-br from-[#201b15] to-[#161411] p-5 shadow-[0_0_30px_rgba(222,118,8,.14)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold"><span className="mr-2 inline-block size-2 rounded-full bg-[#60d79b]" />Live copilot · ready in 32 minutes</p><button onClick={() => setListening((value) => !value)} className="pill green"><span className={`size-1.5 rounded-full ${listening ? "bg-[#6dd49a] shadow-[0_0_8px_#6dd49a]" : "bg-[#877866]"}`} /> {listening ? "Listening" : "Start listening"}</button></div>
          <div className="mt-5 rounded-2xl border border-[#29251f] bg-[#12110f] p-4"><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>2:14 PM</span><span className="pill blue text-[10px]">Q detected</span></div><p className="display mt-4 text-lg text-[#cdbfae]">“{question[0]}”</p></div>
          <div className="mt-3 rounded-[20px] border-2 border-[#d8780e] bg-[radial-gradient(circle_at_0%_50%,rgba(232,148,56,.12),transparent_60%)] p-4"><div className="flex items-center justify-between gap-3"><p className="eyebrow text-[#e6a745]">Copilot suggests</p><span className="pill amber text-[10px]">High match</span></div><p className="mt-4 text-sm">Open with <b className="text-[#f6ae42]">Klarna SMB activation.</b> Use the 47% conversion lift as the headline.</p>{showPlaybook && <p className="mt-5 text-sm leading-6 text-[#d5c8b8]"><b>Frame (90s):</b> At Klarna, I owned the SMB activation funnel — 12k merchants, declining self-serve conversion.<br /><b>Action:</b> Ran 14 experiments/Q. The largest unlock was redesigning verification for first-time merchants.<br /><b>Result:</b> “47% YoY conversion lift, attributable to that redesign.”<br /><b>Why Stripe:</b> Connect this to the PLG motion in Atlas.</p>}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3"><button onClick={() => setActiveQuestion((index) => (index + 1) % questions.length)} className="ghost-button py-2 text-sm">Show next question</button><button onClick={() => setShowPlaybook((value) => !value)} className="ghost-button py-2 text-sm">{showPlaybook ? "Hide playbook" : "Reveal playbook"}</button><button onClick={() => setListening(false)} className="amber-button-quiet py-2 text-sm"><Volume2 size={15} /> Mute coach voice</button></div>
        </section>

        <section className="panel p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="display text-2xl font-bold">Predicted questions</h2><p className="text-sm text-muted-foreground">Based on Stripe&apos;s hiring patterns and this role</p></div><span className="pill amber">12 questions</span></div><div className="mt-5 space-y-2">{questions.map(([title, answer, status], index) => <article key={title} className="overflow-hidden rounded-xl border border-[#302b25]"><button onClick={() => setActiveQuestion(index)} className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium"><span>{title}</span><ChevronDown className={`size-4 shrink-0 text-muted-foreground transition ${activeQuestion === index ? "rotate-180" : ""}`} /></button>{activeQuestion === index && <div className="border-t border-[#302b25] px-4 pb-4 pt-3 text-sm leading-6 text-muted-foreground">{answer}<span className={`pill ml-2 text-[10px] ${status === "Needs polish" ? "amber" : "green"}`}>{status}</span></div>}</article>)}</div><button className="mt-5 w-full text-sm font-semibold text-[#c4b19c]">Show 7 more questions</button></section>

        <section className="panel p-5 sm:p-6"><h2 className="display text-2xl font-bold">Company brief · Stripe</h2><p className="text-sm text-muted-foreground">Generated from public sources, updated daily</p><div className="mt-6 grid gap-6 border-b border-border pb-6 sm:grid-cols-3">{[["Founded", "2010"], ["Headcount", "~8,000"], ["Last round", "$95B val."]].map(([label, value]) => <div key={label}><p className="eyebrow">{label}</p><p className="display mt-2 text-2xl font-bold text-[#eaa13b]">{value}</p></div>)}</div><div className="mt-6"><p className="text-sm font-medium">What&apos;s happening (last 30d)</p><ul className="mt-3 space-y-2 text-sm leading-6 text-[#b8aa98]"><li><b className="mr-2 text-[#eaa13b]">→</b>Launched Stripe Capital for SaaS, expanding beyond e-commerce</li><li><b className="mr-2 text-[#eaa13b]">→</b>Hired 12 PMs across Growth and Platform in Q1</li><li><b className="mr-2 text-[#eaa13b]">→</b>Acquired an Authy competitor (rumored) — focus on identity</li><li><b className="mr-2 text-[#eaa13b]">→</b>Engineering blog post on “the next decade of payments”</li></ul></div><div className="mt-6 border-t border-border pt-6"><p className="text-sm font-medium">Insider tips for this team</p><ul className="mt-3 space-y-2 text-sm leading-6 text-[#b8aa98]"><li>• Growth reports to VP Sarah Patel — your interviewer is on her team.</li><li>• The team works in 2-week sprints, with no big-bang launches.</li><li>• “Data-informed, not data-driven” — bring a thesis, not only metrics.</li></ul></div></section>
      </div>

      <aside className="min-w-0 space-y-5">
        <section className="panel p-5 sm:p-6"><h2 className="display text-2xl font-bold">Upcoming interviews</h2><div className="mt-5 space-y-3">{upcoming.map(([letter, title, person, status, date], index) => <article key={title} className={`rounded-xl border p-4 ${index === 0 ? "border-[#d8780e] bg-[radial-gradient(circle_at_0%_50%,rgba(232,148,56,.1),transparent_55%)] shadow-[0_0_24px_rgba(232,148,56,.1)]" : "border-[#37312b]"}`}><div className="flex flex-wrap items-center gap-3"><TinyCompany letter={letter} tone={letter === "V" ? "black" : "violet"} /><div className="min-w-0 flex-1"><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{person}</p></div><span className={`pill ${index === 1 ? "amber" : "blue"}`}>{status}</span></div><p className="mt-3 text-sm text-muted-foreground">{date}</p>{index === 0 && <div className="mt-3 flex gap-2"><button className="amber-button min-w-0 flex-1 py-2 text-sm"><Play size={14} /> Open prep</button><button className="ghost-button py-2 text-sm">Reschedule</button></div>}</article>)}</div></section>
        <section className="panel p-5 sm:p-6"><div><h2 className="display text-2xl font-bold">Past debriefs</h2><p className="text-sm text-muted-foreground">What worked, what didn&apos;t</p></div><div className="mt-5 space-y-5 text-sm"><article><div className="flex items-center justify-between gap-3"><p className="font-semibold">Figma · PM screen</p><span className="pill green text-[10px]">Moved on</span></div><p className="mt-1 text-xs text-muted-foreground">3 days ago · 32 min</p><p className="mt-2 leading-6 text-[#b8aa98]">“Strong on systems thinking. Could&apos;ve been tighter on why Figma — lead with the 2019 redesign story next time.”</p></article><article><div className="flex items-center justify-between gap-3"><p className="font-semibold">Airbnb · PM screen</p><span className="pill red text-[10px]">Rejected</span></div><p className="mt-1 text-xs text-muted-foreground">1 week ago · 28 min</p><p className="mt-2 leading-6 text-[#b8aa98]">“Mismatch on vision: I pitched B2B-style metrics, they wanted marketplace expertise. Better screening next time.”</p></article></div></section>
        <section className="panel bg-[radial-gradient(circle_at_50%_0%,rgba(232,148,56,.1),transparent_60%),var(--amber-bg-2)] p-5"><div className="flex items-center gap-2"><span className="text-[#f0a133]">?</span><h2 className="display text-lg font-bold">Pro tip</h2></div><p className="mt-3 text-sm leading-6 text-[#b8aa98]">Stripe interviewers value <b className="text-foreground">structured ambiguity</b> — show how you reduce it, don&apos;t pretend it doesn&apos;t exist. Open with what you know, what you&apos;re guessing, and what you need to learn.</p></section>
      </aside>
    </section></ComingSoon>
  );
}
