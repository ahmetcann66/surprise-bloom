import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvitationById } from "@/lib/invitation/store";
import { applyPalette, getTheme } from "@/lib/invitation/themes";
import InvitationPage from "@/components/invitation/invitation-page";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { id } = await params;
  const invitation = await getInvitationById(id);
  if (!invitation) notFound();

  const baseTheme = getTheme(invitation.themeId);
  if (!baseTheme) notFound();

  const theme = applyPalette(baseTheme, invitation.options?.paletteId);

  return <InvitationPage invitation={invitation} theme={theme} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const invitation = await getInvitationById(id);
  if (!invitation) {
    return { title: "Davetiye Bulunamadı" };
  }
  const theme = getTheme(invitation.themeId);
  const { details } = invitation;
  const monogram = details.partnerB
    ? `${details.partnerA} & ${details.partnerB}`
    : details.partnerA;
  return {
    title: `${monogram} — Davetlisin ${theme?.emoji ?? "💌"}`,
    description: `${details.venue}${details.city ? `, ${details.city}` : ""} · ${details.date}${details.time ? ` ${details.time}` : ""}`,
    openGraph: {
      title: `${monogram} — Davetlisin ${theme?.emoji ?? "💌"}`,
      description: `${details.venue}${details.city ? `, ${details.city}` : ""}`,
    },
  };
}
