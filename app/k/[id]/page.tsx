import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessageById } from "@/lib/store";
import { getPalette, getTemplate } from "@/lib/templates";
import GreetingAnimation from "@/components/greeting-animation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GreetingPage({ params }: PageProps) {
  const { id } = await params;
  const greeting = await getMessageById(id);
  if (!greeting) notFound();

  const template = getTemplate(greeting.template);
  if (!template) notFound();

  const theme = getPalette(template, greeting.paletteId);

  return (
    <GreetingAnimation greeting={greeting} template={template} theme={theme} />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const greeting = await getMessageById(id);
  if (!greeting) {
    return { title: "Tebrik Mesajı Bulunamadı" };
  }
  const template = getTemplate(greeting.template);
  const emoji = template?.emoji ?? "💌";
  return {
    title: `${greeting.name} için özel bir mesajın var ${emoji}`,
    description: greeting.message || template?.messages[0],
    openGraph: {
      title: `${greeting.name} için özel bir mesajın var ${emoji}`,
      description: greeting.message || template?.messages[0],
      images: [{ url: `/api/og/${id}`, width: 1200, height: 630 }],
    },
  };
}
