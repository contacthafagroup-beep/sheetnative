"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#07090f] px-6 text-center text-slate-200">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl">
        ✦
      </div>
      <h1 className="text-3xl font-bold text-white">Something went wrong</h1>
      <p className="max-w-md text-slate-400">
        An unexpected error occurred. Please try again — your data is safe.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 font-medium text-white transition hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
