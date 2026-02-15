import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * POST /api/sessions
 *
 * Dev-mode endpoint that writes session JSON to public/sessions/{id}.json.
 * Gated by NODE_ENV -- returns 403 in production (Vercel's filesystem is
 * read-only anyway).
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Session disk writes are only available in development." },
      { status: 403 },
    );
  }

  try {
    const session = await request.json();
    const dir = path.join(process.cwd(), "public", "sessions");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${session.id}.json`),
      JSON.stringify(session, null, 2),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
