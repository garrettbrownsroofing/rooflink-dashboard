type QueryValue = string | number | boolean | null | undefined;

export type RooflinkQuery = Record<string, QueryValue | QueryValue[]>;

export type RooflinkPaginatedResponse<T> = {
  results: T[];
  count?: number;
  next_page?: string | number | null;
  next?: string | null;
};

export class RooflinkError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "RooflinkError";
    this.status = status;
    this.details = details;
  }
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

function buildUrl(baseUrl: string, path: string, query?: RooflinkQuery) {
  const url = new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (!query) return url;

  for (const [key, raw] of Object.entries(query)) {
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      for (const v of raw) {
        if (v === undefined || v === null) continue;
        url.searchParams.append(key, String(v));
      }
      continue;
    }
    url.searchParams.set(key, String(raw));
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

function errorForStatus(status: number) {
  switch (status) {
    case 401:
      return "Rooflink authentication failed (401). Check ROOFLINK_API_KEY.";
    case 403:
      return "Rooflink access forbidden (403). This key may not have permission.";
    case 404:
      return "Rooflink endpoint not found (404).";
    case 429:
      return "Rooflink rate limit exceeded (429). Try again shortly.";
    case 503:
      return "Rooflink service unavailable (503). Try again shortly.";
    default:
      return `Rooflink request failed (${status}).`;
  }
}

function jitterMs(baseMs: number) {
  // +/- up to 250ms jitter to avoid thundering herd
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
    details && typeof details === "object" && "retry_after" in (details as any)
      ? Number((details as any).retry_after)
      : NaN;
  const detailsSeconds =
    Number.isFinite(jsonRetryAfter) && jsonRetryAfter > 0 ? jsonRetryAfter : undefined;

  const serverSuggestedSeconds = retryAfterSeconds ?? detailsSeconds;

  // Docs recommend: 429 wait >= 2s, 503 wait >= 60s
  const minMs = status === 503 ? 60_000 : 2_000;

  // Exponential-ish backoff per attempt: 1x, 2x, 4x...
  const backoffMs = minMs * Math.pow(2, Math.max(0, attempt - 1));
  const serverMs = serverSuggestedSeconds ? serverSuggestedSeconds * 1000 : 0;
  return jitterMs(Math.max(backoffMs, serverMs, minMs));
}

export type RooflinkFetchParams = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: RooflinkQuery;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  retries?: number;
};

const ROOFLINK_BASE_URL =
  "https://integrate.rooflink.com/roof_link_endpoints/api/";

export async function rooflinkFetch<T>(
  path: string,
  params: RooflinkFetchParams = {},
): Promise<T> {
  const apiKey = assertApiKey();
  const url = buildUrl(ROOFLINK_BASE_URL, path, params.query);

  const retries = params.retries ?? 3;
  let lastDetails: unknown = null;
  let lastStatus: number | null = null;
  const hasBody = params.body !== undefined;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const res = await fetch(url, {
      method: params.method ?? "GET",
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(params.headers ?? {}),
      },
      body: params.body === undefined ? undefined : JSON.stringify(params.body),
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

  throw new RooflinkError(
    errorForStatus(lastStatus ?? 500),
    lastStatus ?? 500,
    lastDetails,
  );
}

function getNextPage(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

export async function rooflinkFetchPaginated<T>(
  path: string,
  params: RooflinkFetchParams = {},
  options: { maxPages?: number } = {},
): Promise<{ results: T[]; count?: number }> {
  const maxPages = options.maxPages ?? 50;
  const combined: T[] = [];
  let count: number | undefined;

  let page: string | number | null = null;
  for (let i = 0; i < maxPages; i++) {
    const query: RooflinkQuery = { ...(params.query ?? {}) };
    if (page !== null) query.page = page;

    const data = await rooflinkFetch<RooflinkPaginatedResponse<T>>(path, {
      ...params,
      query,
    });

    if (!data || !Array.isArray(data.results)) {
      throw new RooflinkError(
        "Expected a paginated response with a results array.",
        500,
        data,
      );
    }

    combined.push(...data.results);
    if (typeof data.count === "number") count = data.count;

    const nextPage = getNextPage(data.next_page);
    if (nextPage !== null) {
      page = nextPage;
      continue;
    }

    // Some APIs use `next` as a URL. We support it in a minimal way:
    // if it contains `page=...`, continue; otherwise stop.
    if (typeof data.next === "string" && data.next) {
      try {
        const nextUrl = new URL(data.next);
        const nextParam = nextUrl.searchParams.get("page");
        const parsed = nextParam ? Number(nextParam) : NaN;
        if (!Number.isNaN(parsed)) {
          page = parsed;
          continue;
        }
      } catch {
        // ignore
      }
    }

    break;
  }

  return { results: combined, count };
}

