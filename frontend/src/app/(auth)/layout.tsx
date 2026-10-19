export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b1f3a] via-[#12325a] to-[#1d6feb] px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
