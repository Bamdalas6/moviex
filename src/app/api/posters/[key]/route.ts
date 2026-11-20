import { readPoster } from "@/server/storage";

/** Serves uploaded posters. Keys are random UUIDs, so responses are immutable and cacheable forever. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const poster = await readPoster(key);
  if (!poster) return new Response("Not found", { status: 404 });

  return new Response(poster.bytes, {
    headers: {
      "Content-Type": poster.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
