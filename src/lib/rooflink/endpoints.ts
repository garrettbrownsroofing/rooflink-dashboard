import {
  RooflinkPaginatedResponse,
  RooflinkQuery,
  rooflinkGet,
  rooflinkGetPaginated,
} from "@/lib/rooflink/client";

export type ListParams = {
  page?: number;
  page_size?: number;
  [key: string]: unknown;
};

function cleanQuery(params: Record<string, unknown>): RooflinkQuery {
  const q: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    q[k] = v as any;
  }
  return q;
}

// 1. Prospect jobs list
export async function listProspectJobs(params: ListParams & { date_deleted__isnull?: boolean } = {}) {
  const query = cleanQuery({
    date_deleted__isnull: params.date_deleted__isnull ?? true,
    ...params,
  });
  return await rooflinkGetPaginated<Record<string, unknown>>("/light/jobs/prospect/", { query });
}

// 2. Prospect job details
export async function getProspectJob(id: number | string) {
  return await rooflinkGet<Record<string, unknown>>(`/light/jobs/prospect/${id}/`);
}

// 3. Prospect checklist
export async function getProspectChecklist(id: number | string) {
  return await rooflinkGet<Record<string, unknown>>(`/light/jobs/prospect/${id}/checklist/`);
}

// 4. Public jobs list
export async function listPublicJobs(params: ListParams & { include_custom_data?: boolean } = {}) {
  const query = cleanQuery({ include_custom_data: params.include_custom_data ?? true, ...params });
  return await rooflinkGetPaginated<Record<string, unknown>>("/light/public/jobs/", { query });
}

// 5. Public job details
export async function getPublicJob(id: number | string) {
  return await rooflinkGet<Record<string, unknown>>(`/light/public/jobs/${id}/`);
}

// 6. Approved jobs list
export async function listApprovedJobs(params: ListParams = {}) {
  const query = cleanQuery(params);
  return await rooflinkGetPaginated<Record<string, unknown>>("/light/jobs/approved/", { query });
}

// 7. Job details
export async function getJob(id: number | string) {
  return await rooflinkGet<Record<string, unknown>>(`/light/jobs/${id}/`);
}

// 8. Job checklist
export async function getJobChecklist(id: number | string) {
  return await rooflinkGet<Record<string, unknown>>(`/light/jobs/${id}/checklist/`);
}

// 9. Quick checklist
export async function getJobQuickChecklist(id: number | string) {
  return await rooflinkGet<Record<string, unknown>>(`/light/jobs/${id}/quick_checklist/`);
}

// 10. Customers
export async function listCustomers(params: ListParams = {}) {
  const query = cleanQuery(params);
  return await rooflinkGetPaginated<Record<string, unknown>>("/light/customers/", { query });
}

// 11. Lead analytics
export async function getProspectStats(params: Record<string, unknown> = {}) {
  const query = cleanQuery(params);
  return await rooflinkGet<Record<string, unknown>>("/light/jobs/prospect/stats/", { query });
}

export async function getLeadsBySource(params: Record<string, unknown> = {}) {
  const query = cleanQuery(params);
  return await rooflinkGet<Record<string, unknown> | Array<Record<string, unknown>>>(
    "/light/jobs/leads_by_source/",
    { query },
  );
}

export async function getLeadsTrend(params: Record<string, unknown> = {}) {
  const query = cleanQuery(params);
  // Some docs mention leads_trend; if it doesn't exist, debug route will surface it.
  return await rooflinkGet<Record<string, unknown>>("/light/jobs/leads_trend/", { query });
}

export async function getLeadsByReps(params: Record<string, unknown> = {}) {
  const query = cleanQuery(params);
  return await rooflinkGet<Record<string, unknown>>("/light/jobs/leads_by_reps/", { query });
}

export type EndpointTest = {
  name: string;
  path: string;
  ok: boolean;
  status?: number;
  count?: number | null;
  firstItemKeys?: string[];
  error?: unknown;
};

export function getFirstItemKeys(payload: unknown) {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    const first = payload[0];
    return first && typeof first === "object" && !Array.isArray(first)
      ? Object.keys(first as any).slice(0, 80)
      : [];
  }
  if (typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as any;
    if (Array.isArray(obj.results) && obj.results.length) {
      const first = obj.results[0];
      return first && typeof first === "object" && !Array.isArray(first)
        ? Object.keys(first as any).slice(0, 80)
        : [];
    }
    return Object.keys(obj).slice(0, 80);
  }
  return [];
}

export function getCount(payload: unknown): number | null | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const obj = payload as any;
  if ("count" in obj) return obj.count as any;
  if (Array.isArray(obj.results)) return obj.results.length;
  return undefined;
}

