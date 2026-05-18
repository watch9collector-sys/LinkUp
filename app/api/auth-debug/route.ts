import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: true });
  }

  try {
    const payload = (await request.json()) as unknown;
    console.info("[LinkUp auth debug]", JSON.stringify(payload, null, 2));
  } catch (err: unknown) {
    console.warn("[LinkUp auth debug] failed to read payload", err);
  }

  return NextResponse.json({ ok: true });
}
