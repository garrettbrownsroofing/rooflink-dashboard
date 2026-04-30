import { NextResponse } from "next/server";
import { RooflinkError, rooflinkFetch } from "@/lib/rooflink";

export const runtime = "nodejs";

type CacheEntry = { ts: number; data: unknown };

const CACHE_TTL_MS = 15_000;

function getCache(): Map<string, CacheEntry> {
  const g = globalThis as unknown as { __rooflinkJobsCache?: Map<string, CacheEntry> };
  if (!g.__rooflinkJobsCache) g.__rooflinkJobsCache = new Map();
  return g.__rooflinkJobsCache;
}

function getDateParams(url: URL) {
  const date_from = url.searchParams.get("date_from") ?? undefined;
  const date_to = url.searchParams.get("date_to") ?? undefined;
  return { date_from, date_to };
}

function toPositiveInt(value: string | null, fallback: number) {
  const n = value ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dates = getDateParams(url);

  const page = toPositiveInt(url.searchParams.get("page"), 1);
  const page_size = Math.min(toPositiveInt(url.searchParams.get("page_size"), 50), 250);

  // Cache key: endpoint + query string (minus origin)
  const cacheKey = `${url.pathname}?${new URLSearchParams({
    ...(dates.date_from ? { date_from: dates.date_from } : {}),
    ...(dates.date_to ? { date_to: dates.date_to } : {}),
    page: String(page),
    page_size: String(page_size),
  }).toString()}`;

  const cache = getCache();
  const now = Date.now();
  const existing = cache.get(cacheKey);
  if (existing && now - existing.ts < CACHE_TTL_MS) {
    return NextResponse.json(existing.data, { status: 200 });
  }

  try {
    const data = await rooflinkFetch("/light/job-report/", {
      query: {
        ...(dates.date_from ? { date_from: dates.date_from } : {}),
        ...(dates.date_to ? { date_to: dates.date_to } : {}),
        page,
        page_size,
      },
    });

    const body = { ok: true, page, page_size, dates, data };
    cache.set(cacheKey, { ts: now, data: body });
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    if (err instanceof RooflinkError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          status: err.status,
          details: err.details ?? null,
        },
        { status: err.status >= 400 && err.status < 600 ? err.status : 500 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Unexpected error fetching jobs." },
      { status: 500 },
    );
  }
}

