import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        This is a test deployment hosted on locally hosted server (Raspberry Pi 3B) by Naman Chauhan with ☕
        <h1>
          Check host repository <Link
            href={"https://github.com/chauhannaman98/raspi-hosted"}
            target="_blank"
            className="underline font-bold"
          >
            here on GitHub
          </Link>.
        </h1>
        <h1>
          Check Naman&apos;s GitHub profile <Link
            href={"https://github.com/chauhannaman98"}
            target="_blank"
            className="underline font-bold"
          >
            here
          </Link>.
        </h1>
      </main>
    </div>
  );
}
