import type { NextRequest } from "next/server";
import { discoverSearchSchema } from "@/lib/validation";
import { countFilms, listFilms } from "@/server/queries/films";

export const dynamic = "force-dynamic";

const MAX_PAGE = 48;

/**
 * The next page of Discover's films (search, genre, industry and language
 * filters, top rated first), so the swiper and the results grid can keep
 * loading for as long as there are matches. Public data only.
 */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = discoverSearchSchema.parse(params);
  const offset = Math.max(0, Math.min(100_000, Number.parseInt(params.offset ?? "0", 10) || 0));
  const limit = Math.max(1, Math.min(MAX_PAGE, Number.parseInt(params.limit ?? "24", 10) || 24));

  const [films, total] = await Promise.all([listFilms({ ...filters, sort: "top", limit, offset }), countFilms(filters)]);
  return Response.json(
    { films, total, nextOffset: offset + films.length, hasMore: offset + films.length < total },
    // Same freshness as the pages: public lists may be a minute old.
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
