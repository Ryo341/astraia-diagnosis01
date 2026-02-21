import InfoPageShell from "@/components/InfoPageShell";

export default function PrivacyPage() {
  return (
    <InfoPageShell
      title="プライバシーポリシー"
      lead="Astraia Diagnosis のデータ取り扱い方針です。"
    >
      <p>
        本サイトでは、診断体験を継続する目的で、名前・言語設定・回答データなどをブラウザのローカルストレージに保存する場合があります。
      </p>
      <p>
        これらのデータは基本的にユーザーの端末内で管理され、運営側が個人を特定する情報として自動収集することは想定していません。
      </p>
      <p>
        外部サービス連携や分析ツールを追加する場合は、このページで通知し、必要に応じて方針を更新します。
      </p>
      <p>
        本ポリシーは改善のために改定されることがあります。最新の内容は本ページでご確認ください。
      </p>
    </InfoPageShell>
  );
}
