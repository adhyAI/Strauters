import { auth0 } from "@/lib/auth0";
import Link from "next/link";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 py-32 px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Hackathon-in-a-Box
        </h1>
        <p className="max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
          Paste your hackathon brief and your team&apos;s GitHub usernames. Get
          tailored project ideas from an AI persona panel, pick one, and
          deploy a working starter app &mdash; live &mdash; before you write a
          line of code.
        </p>

        {session ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-zinc-700 dark:text-zinc-300">
              Signed in as {session.user.email}
            </p>
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Go to dashboard
            </Link>
            <a
              href="/auth/logout"
              className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Log out
            </a>
          </div>
        ) : (
          <a
            href="/auth/login"
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in with Google
          </a>
        )}
      </main>
    </div>
  );
}
