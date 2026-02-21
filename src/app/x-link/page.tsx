import InfoPageShell from "@/components/InfoPageShell";

export default function XLinkPage() {
  return (
    <InfoPageShell
      title="Xのリンク"
      lead="最新情報は X (旧Twitter) でも案内できます。"
    >
      <p>
        以下のボタンから X を開けます。運用アカウントを使う場合はリンク先を差し替えてください。
      </p>

      <a
        href="https://x.com/Wo_Ryo"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-xl border border-[#f2d57a]/25 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15"
      >
        X を開く
      </a>

      <p className="text-xs text-white/70">
        現在のリンク先: https://x.com/Wo_Ryo
      </p>
    </InfoPageShell>
  );
}
