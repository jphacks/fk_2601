import type { Metadata } from "next";
import { GroupsScreen } from "@/components/teacher/GroupsScreen";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `グループの管理｜${APP_NAME}`,
};

export default function TeacherGroupsPage() {
  return <GroupsScreen />;
}
