const STEPS = ["Select", "Preview", "Deploy"];

export default function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={
                "flex h-5 w-5 items-center justify-center rounded-full font-medium " +
                (isActive
                  ? "bg-accent text-accent-foreground"
                  : isDone
                    ? "bg-accent/20 text-accent"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500")
              }
            >
              {step}
            </div>
            <span
              className={
                isActive
                  ? "font-medium text-black dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-500"
              }
            >
              {label}
            </span>
            {step < STEPS.length && (
              <span className="mx-1 text-zinc-300 dark:text-zinc-700">
                &rarr;
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
