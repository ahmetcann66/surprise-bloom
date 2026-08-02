import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <p className="text-6xl">💌</p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-800 dark:text-zinc-100">
        Bu tebrik mesajı bulunamadı
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Link yanlış olabilir ya da mesaj silinmiş olabilir.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink-500"
      >
        Kendi linkini oluştur
      </Link>
    </div>
  );
}
