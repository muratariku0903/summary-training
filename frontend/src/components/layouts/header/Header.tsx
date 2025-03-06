import ReversalLink from "@/components/elements/reversal-link/ReversalLink";
import { Spacer } from "@/components/elements/spacer/Spacer";
import UnderlineButton from "@/components/elements/underline-link/UnderlineLink";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-8 text-black">
      <div className="flex items-center">
        <h1 className="ml-2 text-xl font-bold">要約訓練</h1>
      </div>
      <div>
        <UnderlineButton label="使い方" />
        <Spacer size={8} horizontal />
        <UnderlineButton label="メリット" />
        <Spacer size={40} horizontal />
        <ReversalLink label="ログイン" />
        <Spacer size={8} horizontal />
        <ReversalLink label="新規登録" />
      </div>
    </header>
  );
}
