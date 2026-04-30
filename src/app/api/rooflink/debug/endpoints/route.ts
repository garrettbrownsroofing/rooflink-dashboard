import { NextResponse } from "next/server";
import { RooflinkError, toErrorPayload } from "@/lib/rooflink/client";
import {
  getCount,
  getFirstItemKeys,
  listApprovedJobs,
  listCustomers,
  listProspectJobs,
  listPublicJobs,
} from "@/lib/rooflink/endpoints";
import { rooflinkGet } from "@/lib/rooflink/client";

export const runtime = "nodejs";

async function test(name: string, fn: () => Promise<unknown>) {
  try {
    const payload = await fn();
    return {
      name,
      ok: true as const,
      count: getCount(payload),
      firstItemKeys: getFirstItemKeys(payload),
    };
  } catch (err) {
    const e = toErrorPayload(err);
    return {
      name,
      ok: false as const,
      status: e.status,
      error: e.message,
      details: e.details ?? null,
      url: e.url ?? null,
    };
  }
}

export async function GET() {
  const results = await Promise.all([
    test("prospect list", () => listProspectJobs({ page: 1, page_size: 10, date_deleted__isnull: true })),
    test("prospect detail (id=1)", () => rooflinkGet("/light/jobs/prospect/1/")),
    test("prospect checklist (id=1)", () => rooflinkGet("/light/jobs/prospect/1/checklist/")),
    test("public jobs list", () => listPublicJobs({ page: 1, page_size: 25, include_custom_data: true })),
    test("public job detail (id=1)", () => rooflinkGet("/light/public/jobs/1/")),
    test("approved jobs list", () => listApprovedJobs({ page: 1, page_size: 25 })),
    test("job detail (id=1)", () => rooflinkGet("/light/jobs/1/")),
    test("job checklist (id=1)", () => rooflinkGet("/light/jobs/1/checklist/")),
    test("job quick checklist (id=1)", () => rooflinkGet("/light/jobs/1/quick_checklist/")),
    test("customers list", () => listCustomers({ page: 1, page_size: 25 })),
    test("leads by source", () => rooflinkGet("/light/jobs/leads_by_source/")),
    test("leads trend", () => rooflinkGet("/light/jobs/leads_trend/")),
    test("leads by reps", () => rooflinkGet("/light/jobs/leads_by_reps/")),
    test("prospect stats", () => rooflinkGet("/light/jobs/prospect/stats/")),
  ]);

  return NextResponse.json({ ok: true, results }, { status: 200 });
}

