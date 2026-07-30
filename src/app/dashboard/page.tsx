import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import DashboardForm from "./DashboardForm";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-8 py-20 px-6">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Tell us about your hackathon
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Paste the brief and add your team&apos;s GitHub usernames. This
            step is free.
          </p>
        </div>
        <DashboardForm />
      </main>
    </div>
  );
}
