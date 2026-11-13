import { Jp } from "./RubyText";
import { Navigator } from "./Navigator";
import { Page } from "./Page";
import { Button, LinkButton } from "./ui";

/**
 * 予期しないエラーや、ないページ（404）のときの画面（見本 09「あれれ？」とそろえる）。
 * 読み込み中のまま固まったり、画面が真っ白になったりしないよう、子どもにも分かる文と、やり直す・ホームへ もどるボタンを出す
 */
export function ErrorScreen({ kind, onRetry }: { kind: "error" | "notfound"; onRetry?: () => void }) {
  return (
    <Page>
      <div className="flex flex-1 flex-col items-center gap-4">
        <div className="mt-auto">
          <Navigator mood="sorry" size={160} />
        </div>
        <h1 className="text-center font-pop text-[30px] font-normal leading-normal">
          あれれ？
          <br />
          <Jp big>{kind === "notfound" ? "{見|み}つからないよ" : "うまくいかなかったよ"}</Jp>
        </h1>
        <p className="rounded-card bg-navi-light px-4 py-3 text-center text-[19px] font-black leading-[1.75]">
          {kind === "notfound" ? (
            <>
              この ページは
              <br />
              <Jp>{"ないみたい。ホームに {戻|もど}ろう！"}</Jp>
            </>
          ) : (
            <>
              <Jp>{"もう{一度|いちど} {試|ため}してね。"}</Jp>
              <br />
              <Jp>{"だめなときは ホームに {戻|もど}ろう！"}</Jp>
            </>
          )}
        </p>
        <div className="mt-auto flex w-full flex-col gap-3.5">
          {onRetry && (
            <Button variant="seeno" onClick={onRetry}>
              <Jp big>{"もう{一度|いちど} {試|ため}す"}</Jp>
            </Button>
          )}
          <LinkButton href="/" variant={onRetry ? "sub" : "main"}>
            <Jp>{"ホームに {戻|もど}る"}</Jp>
          </LinkButton>
        </div>
      </div>
    </Page>
  );
}
