import Link from "next/link";

export default function InviteNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <span className="text-5xl">💌</span>
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
        Davetiye bulunamadı
      </h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Bu link geçersiz ya da silinmiş olabilir. Yeni bir davetiye oluşturmak
        için ana sayfaya dönebilirsin.
      </p>
      <Link
        href="/"
        className="rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink-500"
      >
        Davetiye Oluştur
      </Link>
    </main>
  );
}
