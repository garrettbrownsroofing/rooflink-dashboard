import { NextResponse } from "next/server";
import { toErrorPayload } from "@/lib/rooflink/client";
import {
  getJob,
  getJobChecklist,
  getJobQuickChecklist,
  getProspectChecklist,
  getProspectJob,
  listApprovedJobs,
  listCustomers,
  listProspectJobs,
} from "@/lib/rooflink/endpoints";

export const runtime = "nodejs";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function keysOf(v: unknown) {
  if (!isRecord(v)) return [];
  return Object.keys(v).sort();
}

function mergeKeys(map: Record<string, string[]>, name: string, payload: unknown) {
  map[name] = keysOf(payload);
}

export async function GET() {
  try {
    const [prospectList, approvedList, customers] = await Promise.all([
      listProspectJobs({ page: 1, page_size: 10, date_deleted__isnull: true }),
      listApprovedJobs({ page: 1, page_size: 10 }),
      listCustomers({ page: 1, page_size: 10 }),
    ]);

    const firstProspect = prospectList.results?.[0] as any;
    const firstApproved = approvedList.results?.[0] as any;

    const [prospectDetail, prospectChecklist, jobDetail, jobChecklist, quickChecklist] =
      await Promise.all([
        firstProspect?.id ? getProspectJob(firstProspect.id).catch(() => null) : Promise.resolve(null),
        firstProspect?.id ? getProspectChecklist(firstProspect.id).catch(() => null) : Promise.resolve(null),
        firstApproved?.id ? getJob(firstApproved.id).catch(() => null) : Promise.resolve(null),
        firstApproved?.id ? getJobChecklist(firstApproved.id).catch(() => null) : Promise.resolve(null),
        firstApproved?.id ? getJobQuickChecklist(firstApproved.id).catch(() => null) : Promise.resolve(null),
      ]);

    const schema: Record<string, string[]> = {};
    mergeKeys(schema, "prospect_list_item", firstProspect ?? null);
    mergeKeys(schema, "prospect_detail", prospectDetail);
    mergeKeys(schema, "prospect_checklist", prospectChecklist);
    mergeKeys(schema, "approved_list_item", firstApproved ?? null);
    mergeKeys(schema, "job_detail", jobDetail);
    mergeKeys(schema, "job_checklist", jobChecklist);
    mergeKeys(schema, "job_quick_checklist", quickChecklist);
    mergeKeys(schema, "customer_list_item", customers.results?.[0] ?? null);

    return NextResponse.json(
      {
        ok: true,
        ids: {
          prospect_id: firstProspect?.id ?? null,
          approved_id: firstApproved?.id ?? null,
        },
        schema,
      },
      { status: 200 },
    );
  } catch (err) {
    const e = toErrorPayload(err);
    return NextResponse.json(e, { status: e.status });
  }
}

