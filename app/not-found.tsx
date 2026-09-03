import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#07090f] px-6 text-center text-slate-200">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl">
        ✦
      </div>
      <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-5xl font-bold text-transparent">
        404
      </h1>
      <p className="max-w-md text-slate-400">
        This page doesn&apos;t exist. It may have been moved, or the link is out of date.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 font-medium text-white transition hover:opacity-90"
      >
        Back to home
      </Link>
    </main>
  );
}
