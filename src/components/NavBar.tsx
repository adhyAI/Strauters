import Link from "next/link";
import { auth0 } from "@/lib/auth0";

export default async function NavBar() {
  const session = await auth0.getSession();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-black dark:text-zinc-50"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
            H
          </span>
          Hackathon-in-a-Box
        </Link>

        {session ? (
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/dashboard"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/history"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              History
            </Link>
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-6 dark:border-zinc-800">
              <span className="hidden text-zinc-500 sm:inline dark:text-zinc-500">
                {session.user.email}
              </span>
              <a
                href="/auth/logout"
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Log out
              </a>
            </div>
          </nav>
        ) : (
          <a
            href="/auth/login"
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
