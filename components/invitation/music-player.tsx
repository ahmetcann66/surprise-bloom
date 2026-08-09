"use client";

interface MusicPlayerProps {
  label: string;
  playing: boolean;
  onToggle: () => void;
}

export default function MusicPlayer({ label, playing, onToggle }: MusicPlayerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      title={playing ? "Müziği durdur" : "Müziği çal"}
      className="flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/50"
    >
      <span aria-hidden className="text-base leading-none">
        {playing ? "⏸" : "♪"}
      </span>
      {playing ? "Durdur" : label}
    </button>
  );
}
