import { Navigator } from "@/components/Navigator";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Navigator mood="happy" size={140} />
      <h1 className="text-2xl font-bold">{APP_NAME}</h1>
      <p>じゅんびちゅう</p>
    </main>
  );
}
