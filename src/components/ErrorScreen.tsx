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
          {kind === "notfound" ? "みつからないよ" : "うまくいかなかったよ"}
        </h1>
        <p className="rounded-card bg-navi-light px-4 py-3 text-center text-[19px] font-black leading-[1.75]">
          {kind === "notfound" ? (
            <>
              この ページは
              <br />
              ないみたい。ホームに もどろう！
            </>
          ) : (
            <>
              もういちど ためしてね。
              <br />
              だめなときは ホームに もどろう！
            </>
          )}
        </p>
        <div className="mt-auto flex w-full flex-col gap-3.5">
          {onRetry && (
            <Button variant="seeno" onClick={onRetry}>
              もういちど ためす
            </Button>
          )}
          <LinkButton href="/" variant={onRetry ? "sub" : "main"}>
            ホームに もどる
          </LinkButton>
        </div>
      </div>
    </Page>
  );
}
