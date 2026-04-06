export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-screen items-center justify-center bg-sidebar px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-background p-8 shadow-[var(--shadow-float)] md:p-10">
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}
