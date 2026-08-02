import { ImageResponse } from "next/og";
import { getMessageById } from "@/lib/store";
import { getPalette, getTemplate } from "@/lib/templates";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const greeting = await getMessageById(id);
  const template = greeting ? getTemplate(greeting.template) : undefined;

  const emoji = template?.emoji ?? "💌";
  const name = greeting?.name ?? "Sevgili";
  const message =
    greeting?.message ?? template?.messages[0] ?? "Sana özel bir mesajım var";
  const theme = getPalette(template, greeting?.paletteId);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px",
          background: theme.ogBackground,
          color: theme.textColor,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 110, lineHeight: 1 }}>{emoji}</div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            marginTop: 28,
            textShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
        >
          {name} için özel bir mesajın var
        </div>
        <div style={{ fontSize: 42, opacity: 0.9, marginTop: 18, maxWidth: 900 }}>
          {message}
        </div>
        <div style={{ display: "flex", marginTop: 44 }}>
          {theme.petalColors.map((color, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: 9999,
                background: color,
                margin: "0 9px",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
