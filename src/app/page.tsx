import { auth0 } from "@/lib/auth0";
import Link from "next/link";

const STEPS = [
  {
    title: "Tell us about your hackathon",
    body: "Paste the brief and add up to 3 teammates' GitHub usernames. Free, no signup required to try.",
  },
  {
    title: "Get a shortlist from an AI panel",
    body: "Four AI personas, each with a different mindset (pragmatist, ship-fast builder, startup lens, ambitious builder), independently evaluate your team and brief, then get merged into 3 ranked project ideas.",
  },
  {
    title: "Pick one, get the brief",
    body: "Each idea comes with a rationale, suggested roles per teammate, and a downloadable project brief — free.",
  },
  {
    title: "Deploy it live",
    body: "Pro subscribers can deploy a working starter app for their idea with one click, provisioned live through the Stripe Projects CLI. No manual signups, no terminal.",
  },
];

const FEATURES = [
  {
    title: "GitHub-informed ideas",
    body: "We pull each teammate's public repos and languages so suggestions actually fit the skills in the room.",
  },
  {
    title: "Multi-persona AI panel",
    body: "Not one generic AI opinion — four distinct evaluation lenses debate and converge on a shortlist.",
  },
  {
    title: "Real live deploy",
    body: "Deploying isn't a mockup: it provisions real infrastructure and hands you back a working URL.",
  },
  {
    title: "Built on Stripe Projects",
    body: "Auth, database, and hosting for this app itself were provisioned via the Stripe Projects CLI — the same tech powering your deploy.",
  },
];

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-6 pb-16 pt-24 text-center">
        <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Built for the Auth0 x Stripe hackathon
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          Hackathon-in-a-Box
        </h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Paste your hackathon brief and your team&apos;s GitHub usernames.
          Get tailored project ideas from an AI persona panel, pick one, and
          deploy a working starter app &mdash; live &mdash; before you write
          a line of code.
        </p>

        {session ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Signed in as {session.user.email}
            </p>
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-full bg-accent px-8 text-accent-foreground transition-opacity hover:opacity-90"
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
          <div className="flex flex-col items-center gap-2">
            <a
              href="/auth/login"
              className="flex h-12 items-center justify-center rounded-full bg-accent px-8 text-accent-foreground transition-opacity hover:opacity-90"
            >
              Sign in with Google
            </a>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Free to generate ideas. $5/mo to deploy live.
            </p>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-200 px-6 py-16 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-semibold text-black dark:text-zinc-50">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-medium text-black dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-white px-6 py-16 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-semibold text-black dark:text-zinc-50">
            What makes it different
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
              >
                <h3 className="font-medium text-black dark:text-zinc-50">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-zinc-200 px-6 py-16 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-semibold text-black dark:text-zinc-50">
            Simple pricing
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="text-lg font-medium text-black dark:text-zinc-50">
                Free
              </h3>
              <p className="mt-1 text-3xl font-semibold text-black dark:text-zinc-50">
                $0
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Unlimited idea generations</li>
                <li>Full AI persona panel</li>
                <li>Downloadable project briefs</li>
              </ul>
            </div>
            <div className="rounded-lg border-2 border-accent p-6">
              <h3 className="text-lg font-medium text-black dark:text-zinc-50">
                Pro
              </h3>
              <p className="mt-1 text-3xl font-semibold text-black dark:text-zinc-50">
                $5<span className="text-base font-normal">/mo</span>
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Everything in Free</li>
                <li>Deploy your idea live, one click</li>
                <li>Real infra, provisioned via Stripe Projects</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!session && (
        <section className="border-t border-zinc-200 px-6 py-16 text-center dark:border-zinc-800">
          <a
            href="/auth/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-accent-foreground transition-opacity hover:opacity-90"
          >
            Sign in with Google to get started
          </a>
        </section>
      )}
    </div>
  );
}
