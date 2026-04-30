import { NextResponse } from "next/server";
import { toErrorPayload } from "@/lib/rooflink/client";
import { listProspectJobs } from "@/lib/rooflink/endpoints";
import { getProspectChecklist, getProspectJob } from "@/lib/rooflink/endpoints";
import { normalizeProspect } from "@/lib/rooflink/normalizers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const list = await listProspectJobs({ page: 1, page_size: 10, date_deleted__isnull: true });
    const raw = list.results ?? [];

    const ids = raw
      .map((r: any) => r?.id)
      .filter((id: any) => typeof id === "number" || (typeof id === "string" && id));

    const hydrated = await Promise.all(
      ids.slice(0, 5).map(async (id) => {
        const [detail, checklist] = await Promise.all([
          getProspectJob(id).catch(() => null),
          getProspectChecklist(id).catch(() => null),
        ]);
        return { id, detail, checklist };
      }),
    );

    const normalized = raw.map((r: any) => normalizeProspect(r)).filter(Boolean);

    return NextResponse.json(
      { ok: true, listMeta: { count: list.count, next_page: list.next_page }, raw, normalized, hydrated },
      { status: 200 },
    );
  } catch (err) {
    const e = toErrorPayload(err);
    return NextResponse.json(e, { status: e.status });
  }
}

