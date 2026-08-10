import type { Ref } from "react";
import type { InvitationTheme } from "@/lib/invitation/themes";

interface EnvelopeVisualProps {
  theme: InvitationTheme;
  recipientName?: string | null;
  monogram: string;
  className?: string;
  /** Animasyonlu parçalara dışarıdan ref bağlamak için. */
  flapRef?: Ref<HTMLDivElement>;
  sealRef?: Ref<HTMLDivElement>;
  letterRef?: Ref<HTMLDivElement>;
}

// Zarfın statik görseli. Hem gerçek davetiye (GSAP animasyonlu sarmalayıcı)
// hem de formdaki canlı önizleme bu görseli paylaşır.
export default function EnvelopeVisual({
  theme,
  recipientName,
  monogram,
  className,
  flapRef,
  sealRef,
  letterRef,
}: EnvelopeVisualProps) {
  return (
    <div
      className={className}
      style={{ aspectRatio: "3 / 2", transformStyle: "preserve-3d" }}
    >
      {/* arka iç yüz */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ background: theme.envelope.body }}
      />
      {/* mektup */}
      <div
        ref={letterRef}
        className="absolute left-[10%] right-[10%] top-[12%] bottom-[10%] flex flex-col items-center justify-center rounded-xl border px-4 py-3 text-center shadow-lg"
        style={{
          background: theme.envelope.letter,
          borderColor: `${theme.accent}55`,
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: theme.centerColor }}
        >
          Davet
        </p>
        <p
          className="mt-1 text-lg font-bold leading-tight"
          style={{ color: theme.couple.suit }}
        >
          {monogram}
        </p>
        <p className="mt-1 text-xs" style={{ color: theme.couple.suit }}>
          Birlikte kutlamak üzere
        </p>
      </div>
      {/* ön cep */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: theme.envelope.pocket,
          clipPath: "polygon(0 0, 50% 46%, 100% 0, 100% 100%, 0 100%)",
        }}
      />
      {recipientName && (
        <p
          className="absolute inset-x-0 bottom-[7%] text-center text-sm italic"
          style={{ color: theme.couple.suit }}
        >
          Sevgili {recipientName}
        </p>
      )}
      {/* mühür */}
      <div
        ref={sealRef}
        className="absolute left-1/2 top-[49%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xl shadow-lg"
        style={{ background: theme.envelope.seal }}
      >
        {theme.emoji}
      </div>
      {/* kapak */}
      <div
        ref={flapRef}
        className="absolute inset-x-0 top-0 h-[52%] rounded-t-2xl"
        style={{
          background: theme.envelope.flap,
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          transformOrigin: "50% 0%",
          transformStyle: "preserve-3d",
        }}
      />
    </div>
  );
}
