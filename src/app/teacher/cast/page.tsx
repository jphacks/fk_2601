import { CastScreen } from "@/components/teacher/CastScreen";
import { CAST_FONT_STYLE, chalkFont } from "../castFonts";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

// はてなの画面から開くときは、選んだ はてな（post）と、しぼりこんだ分野・単元（field・unit）を受け取る
export default async function TeacherCastPage({ searchParams }: { searchParams: SearchParams }) {
  const q = await searchParams;
  return (
    <div className={`${chalkFont.variable} contents`} style={CAST_FONT_STYLE}>
      <CastScreen post={one(q.post)} field={one(q.field)} unit={one(q.unit)} />
    </div>
  );
}
