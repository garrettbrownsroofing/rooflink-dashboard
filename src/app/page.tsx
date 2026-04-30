import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            Browns Roofing Reporting
          </h1>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            Choose a reporting workspace
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-6">
            <div className="text-xl font-semibold">Live Data</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              View the current live data dashboard already connected in this app.
            </div>
            <div className="mt-5">
              <Link
                href="/live-data"
                className="inline-flex h-11 items-center justify-center rounded-md bg-black px-5 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Open Live Data
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-6">
            <div className="text-xl font-semibold">Manual Reporting Scorecard</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Enter and review weekly residential sales scorecard data by market.
            </div>
            <div className="mt-5">
              <Link
                href="/scorecard"
                className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 bg-white/70 px-5 text-sm font-medium text-black hover:bg-black/5 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Open Scorecard
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-black/60 dark:text-white/60">
          Live data is read-only and API keys remain server-side.
        </div>
      </div>
    </div>
  );
}
