import type { NextRequest } from "next/server";
import { getSuggestions } from "@/lib/queries.ts";

// GET /api/v1/search?q=jai → places, cities and states for the header search box.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 60) return Response.json({ results: [] });
  return Response.json({ results: await getSuggestions(q.toLowerCase()) });
}
