type QueryValue = string | number | boolean | null | undefined;

export type RooflinkQuery = Record<string, QueryValue | QueryValue[]>;

export type RooflinkPaginatedResponse<T> = {
  count: number | null;
  from_index?: number | null;
  to_index?: number | null;
  next: string | null;
  previous?: string | null;
  next_page: number | null;
  results: T[];
};

export type RooflinkErrorPayload = {
  ok: false;
  status: number;
  message: string;
  url?: string;
  details?: unknown;
};

export class RooflinkError extends Error {
  status: number;
  details?: unknown;
  url?: string;

  constructor(message: string, status: number, details?: unknown, url?: string) {
    super(message);
    this.name = "RooflinkError";
    this.status = status;
    this.details = details;
    this.url = url;
  }
}

export const ROOFLINK_BASE_URL = "https://integrate.rooflink.com/roof_link_endpoints/api";

function assertApiKey(): string {
  const apiKey = process.env.ROOFLINK_API_KEY?.trim();
  if (!apiKey) {
    throw new RooflinkError(
      "Missing ROOFLINK_API_KEY. Set it in your environment variables.",
      500,
    );
  }
  return apiKey;
}

function buildUrl(path: string, query?: RooflinkQuery) {
  const base = ROOFLINK_BASE_URL.endsWith("/") ? ROOFLINK_BASE_URL : `${ROOFLINK_BASE_URL}/`;
  const url = new URL(path.replace(/^\//, ""), base);
  if (query) {
    for (const [k, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;
      if (Array.isArray(raw)) {
        for (const v of raw) {
          if (v === undefined || v === null) continue;
          url.searchParams.append(k, String(v));
        }
      } else {
        url.searchParams.set(k, String(raw));
      }
    }
  }
  return url;
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function baseErrorMessage(status: number) {
  switch (status) {
    case 401:
      return "RoofLink authentication failed (401). Check ROOFLINK_API_KEY.";
    case 403:
      return "RoofLink access forbidden (403). This key may not have permission.";
    case 404:
      return "RoofLink endpoint/object not found (404).";
    case 429:
      return "RoofLink rate limit exceeded (429). Please retry.";
    case 503:
      return "RoofLink service unavailable (503). Please retry.";
    default:
      return `RoofLink request failed (${status}).`;
  }
}

function jitterMs(baseMs: number) {
  const delta = Math.floor(Math.random() * 500) - 250;
  return Math.max(0, baseMs + delta);
}

function retryDelayMs(
  status: number,
  attempt: number,
  details: unknown,
  retryAfterHeader: string | null,
) {
  const headerSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  const retryAfterSeconds =
    Number.isFinite(headerSeconds) && headerSeconds > 0 ? headerSeconds : undefined;

  const jsonRetryAfter =
    details && typeof details === "object" && details !== null && "retry_after" in (details as any)
      ? Number((details as any).retry_after)
      : NaN;
  const detailsSeconds =
    Number.isFinite(jsonRetryAfter) && jsonRetryAfter > 0 ? jsonRetryAfter : undefined;

  const serverSuggestedSeconds = retryAfterSeconds ?? detailsSeconds;

  // Docs recommend: 429 wait >= 2s, 503 wait >= 60s
  const minMs = status === 503 ? 60_000 : 2_000;
  const backoffMs = minMs * Math.pow(2, Math.max(0, attempt - 1));
  const serverMs = serverSuggestedSeconds ? serverSuggestedSeconds * 1000 : 0;
  return jitterMs(Math.max(backoffMs, serverMs, minMs));
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Aborted"));
      return;
    }
    const t = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(t);
          reject(new Error("Aborted"));
        },
        { once: true },
      );
    }
  });
}

export type RooflinkGetParams = {
  query?: RooflinkQuery;
  signal?: AbortSignal;
  retries?: number;
};

/**
 * Read-only RoofLink client.
 * CRITICAL: This wrapper only supports GET requests.
 */
export async function rooflinkGet<T>(
  path: string,
  params: RooflinkGetParams = {},
): Promise<T> {
  const apiKey = assertApiKey();
  const url = buildUrl(path, params.query);

  const retries = params.retries ?? 3;
  let lastDetails: unknown = null;
  let lastStatus: number | null = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
      signal: params.signal,
      cache: "no-store",
    });

    if (res.ok) {
      return (await res.json()) as T;
    }

    const details = await parseJsonSafe(res);
    lastDetails = details;
    lastStatus = res.status;

    const canRetry = res.status === 429 || res.status === 503;
    const hasAttemptsLeft = attempt <= retries;
    if (!canRetry || !hasAttemptsLeft) break;

    const delay = retryDelayMs(res.status, attempt, details, res.headers.get("retry-after"));
    await sleep(delay, params.signal);
  }

  const status = lastStatus ?? 500;
  throw new RooflinkError(baseErrorMessage(status), status, lastDetails, url.toString());
}

export async function rooflinkGetPaginated<T>(
  path: string,
  params: RooflinkGetParams = {},
): Promise<RooflinkPaginatedResponse<T>> {
  return await rooflinkGet<RooflinkPaginatedResponse<T>>(path, params);
}

export async function fetchAllPaginated<T>(
  fetchPage: (params: { page: number; page_size: number }) => Promise<RooflinkPaginatedResponse<T>>,
  options: { pageSize?: number; maxPages?: number } = {},
) {
  const pageSize = options.pageSize ?? 100;
  const maxPages = options.maxPages ?? 500;
  const results: T[] = [];
  let count: number | null | undefined;

  let page = 1;
  for (let i = 0; i < maxPages; i++) {
    const data = await fetchPage({ page, page_size: pageSize });
    if (typeof data.count === "number" || data.count === null) count = data.count;
    results.push(...(Array.isArray(data.results) ? data.results : []));
    if (!data.next_page) break;
    page = data.next_page;
  }

  return { results, count };
}

export function toErrorPayload(err: unknown): RooflinkErrorPayload {
  if (err instanceof RooflinkError) {
    return {
      ok: false,
      status: err.status,
      message: err.message,
      details: err.details ?? null,
      url: err.url,
    };
  }
  return { ok: false, status: 500, message: "Unexpected error.", details: null };
}

