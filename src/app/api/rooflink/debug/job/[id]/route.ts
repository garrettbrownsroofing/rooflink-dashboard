import { NextResponse } from "next/server";
import { toErrorPayload } from "@/lib/rooflink/client";
import {
  getJob,
  getJobChecklist,
  getJobQuickChecklist,
  getProspectChecklist,
  getProspectJob,
} from "@/lib/rooflink/endpoints";
import { normalizeApprovedJob, normalizeProspect } from "@/lib/rooflink/normalizers";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  try {
    const [prospectDetail, prospectChecklist, jobDetail, jobChecklist, jobQuickChecklist] =
      await Promise.all([
        getProspectJob(id).catch(() => null),
        getProspectChecklist(id).catch(() => null),
        getJob(id).catch(() => null),
        getJobChecklist(id).catch(() => null),
        getJobQuickChecklist(id).catch(() => null),
      ]);

    const normalized = {
      prospect: prospectDetail
        ? normalizeProspect(prospectDetail, { checklist: prospectChecklist })
        : null,
      job: jobDetail
        ? normalizeApprovedJob(jobDetail, { checklist: jobChecklist, quickChecklist: jobQuickChecklist })
        : null,
    };

    return NextResponse.json(
      {
        ok: true,
        id,
        raw: {
          prospectDetail,
          prospectChecklist,
          jobDetail,
          jobChecklist,
          jobQuickChecklist,
        },
        normalized,
      },
      { status: 200 },
    );
  } catch (err) {
    const e = toErrorPayload(err);
    return NextResponse.json(e, { status: e.status });
  }
}

