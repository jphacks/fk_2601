import { SettingsScreen } from "@/components/teacher/SettingsScreen";
import { CAST_FONT_STYLE, chalkFont } from "../castFonts";

// 参加コードを教室に大きく映すので、映す画面の文字をこのページで読み込む（contents で、外わくのレイアウトは変えない）
export default function TeacherSettingsPage() {
  return (
    <div className={`${chalkFont.variable} contents`} style={CAST_FONT_STYLE}>
      <SettingsScreen />
    </div>
  );
}
