export function ComingSoon({ children }: { children: React.ReactNode }) {
  return <div className="relative opacity-45 grayscale"><div className="pointer-events-none">{children}</div><div className="absolute inset-0 grid place-items-center rounded-[20px] bg-[#0a0807]/45"><span className="rounded-full border border-[#5b5043] bg-[#201c17] px-4 py-2 text-sm font-semibold text-[#e8d7c1] shadow-xl">Coming soon</span></div></div>;
}
