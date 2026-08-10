import type { ReactNode } from "react";

interface PanelLayoutProps {
  children: ReactNode;
  /**
   * Tam ekran gradient/mesh arka plan katmanı.
   * - undefined: varsayılan lacivert-pembe gradient kullanılır
   * - null: arka plan çizilmez (üst bileşen kendi arka planını sağlar)
   * - ReactNode: verilen katman çizilir
   */
  background?: ReactNode;
  className?: string;
}

/**
 * Tüm "oluşturma paneli" sayfaları için ortak dış layout.
 * Genişlik davranışı burada tek noktadan yönetilir:
 * - Mobil (<768px): kart %100 genişlik, 16-20px padding, yuvarlatma yok
 * - Tablet (768-1024px): maks. 800-1000px, ortalanmış
 * - Geniş ekran (>1024px): maks. 1200px
 */
export default function PanelLayout({
  children,
  background,
  className = "",
}: PanelLayoutProps) {
  return (
    <div className={`relative min-h-dvh w-full overflow-hidden ${className}`}>
      {background ??
        (background === undefined && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 20% 10%, rgba(168,85,247,0.5) 0%, transparent 55%), radial-gradient(120% 90% at 80% 20%, rgba(236,72,153,0.45) 0%, transparent 55%), linear-gradient(160deg, #1c1430 0%, #0a0a0f 100%)",
            }}
          />
        ))}

      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-start px-4 py-8 min-[768px]:px-6 min-[768px]:py-10 min-[1025px]:px-8 min-[1025px]:py-14">
        <div className="w-full rounded-none border border-white/15 bg-white/10 px-4 py-8 shadow-2xl backdrop-blur-xl min-[768px]:max-w-[800px] min-[768px]:rounded-3xl min-[768px]:px-8 min-[768px]:py-10 min-[900px]:max-w-[1000px] min-[1025px]:max-w-[1200px] dark:bg-zinc-950/40">
          {children}
        </div>
      </div>
    </div>
  );
}
