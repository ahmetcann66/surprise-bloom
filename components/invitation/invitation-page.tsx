"use client";

/* eslint-disable react-hooks/set-state-in-effect -- matchMedia sonucu durum güncelleme gerekli */

import { useEffect, useState } from "react";
import Envelope from "@/components/invitation/envelope";
import CoupleReveal from "@/components/invitation/couple-reveal";
import MusicPlayer from "@/components/invitation/music-player";
import { useInvitationMusic } from "@/hooks/use-invitation-music";
import { musicLabel } from "@/lib/music";
import type { Invitation } from "@/lib/invitation/types";
import type { InvitationTheme } from "@/lib/invitation/themes";
import type { GreetingAudio } from "@/lib/types";

const DEFAULT_AUDIO: GreetingAudio = { type: "clip", value: "sihir" };

interface InvitationPageProps {
  invitation: Invitation;
  theme: InvitationTheme;
}

export default function InvitationPage({
  invitation,
  theme,
}: InvitationPageProps) {
  const [opened, setOpened] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const { details } = invitation;
  const monogram = details.partnerB
    ? `${details.partnerA} & ${details.partnerB}`
    : details.partnerA;
  const audio: GreetingAudio | null = invitation.audio ?? DEFAULT_AUDIO;
  const { playing, start, toggle } = useInvitationMusic(audio);
  const label = musicLabel(audio);

  const handleOpen = () => {
    setOpened(true);
    start();
  };

  if (!opened) {
    return (
      <Envelope
        theme={theme}
        recipientName={invitation.name}
        monogram={monogram}
        onOpen={handleOpen}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <div className="relative min-h-dvh">
      <CoupleReveal
        theme={theme}
        eventType={details.eventType}
        partnerA={details.partnerA}
        partnerB={details.partnerB}
        message={details.message}
        date={details.date}
        time={details.time}
        venue={details.venue}
        city={details.city}
        address={details.address}
        photo={invitation.photo}
        recipientName={invitation.name}
        reducedMotion={reducedMotion}
      />
      {label && (
        <div className="absolute bottom-3 right-3 z-30">
          <MusicPlayer label={label} playing={playing} onToggle={toggle} />
        </div>
      )}
    </div>
  );
}
