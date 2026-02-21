import Link from "next/link";
import type { ReactNode } from "react";

type InfoPageShellProps = {
  title: string;
  lead: string;
  children: ReactNode;
};

export default function InfoPageShell(props: InfoPageShellProps) {
  const { title, lead, children } = props;

  return (
    <main className="min-h-screen text-white">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url(/title/bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-black/45" />

      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <section className="w-full rounded-[30px] border border-[#f2d57a]/25 bg-black/45 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-5">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-white/75">{lead}</p>
            </div>

            <Link
              href="/"
              className="rounded-xl border border-[#f2d57a]/25 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15"
            >
              タイトルへ戻る
            </Link>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/88">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
