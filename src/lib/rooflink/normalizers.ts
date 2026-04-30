export type DashboardStage =
  | "lead_created"
  | "lead_verified"
  | "assigned"
  | "inspection_scheduled"
  | "inspection_complete"
  | "claim_filed"
  | "measured"
  | "estimate_created"
  | "contract_signed"
  | "submitted"
  | "approved"
  | "roof_complete"
  | "closed"
  | "rejected"
  | "deleted";

export type NormalizedJob = {
  id: string;
  sourceType: "prospect" | "approved" | "public";
  jobNumber?: string;
  name?: string;

  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  fullAddress?: string;
  region?: string;
  leadSource?: string;

  rep?: string;
  altRep?: string;
  marketingRep?: string;
  projectManager?: string;

  jobType?: string;
  bidType?: string;

  currentStatus?: string;
  stage?: DashboardStage;

  dateCreated?: string;
  dateLastEdited?: string;
  dateSigned?: string;
  dateApproved?: string;
  dateRoofComplete?: string;
  dateClosed?: string;

  pipeline?: unknown;
  checklist?: unknown;
  photos?: unknown;
  estimates?: unknown;

  raw: unknown;
};

export type ProspectStatusCode =
  | "ad"
  | "uv"
  | "ua"
  | "as"
  | "v"
  | "i"
  | "cf"
  | "rla"
  | "est"
  | "si"
  | "su"
  | "re"
  | "d";

export const PROSPECT_STATUS_MAP: Record<ProspectStatusCode, DashboardStage> = {
  ad: "lead_created",
  uv: "lead_created",
  ua: "lead_created",
  as: "assigned",
  v: "lead_verified",
  i: "inspection_complete",
  cf: "claim_filed",
  rla: "measured",
  est: "estimate_created",
  si: "contract_signed",
  su: "submitted",
  re: "rejected",
  d: "deleted",
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asString(v: unknown) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function asId(v: unknown) {
  if (typeof v === "number") return String(v);
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function pick(obj: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    const s = asString(v);
    if (s !== undefined) return s;
    const id = asId(v);
    if (id !== undefined && (k.endsWith("_id") || k === "id")) return id;
  }
  return undefined;
}

function getCustomerInfo(raw: Record<string, unknown>) {
  const customer = isRecord(raw.customer) ? raw.customer : undefined;

  const customerName =
    asString(raw.customer_name) ??
    (customer ? (asString(customer.name) ?? asString((customer as any).full_name) ?? asString((customer as any).display_name)) : undefined);

  const customerEmail =
    asString(raw.customer_email) ??
    (customer ? asString((customer as any).email) : undefined);

  const customerPhone =
    asString(raw.customer_phone) ??
    asString(raw.phone) ??
    asString(raw.cell) ??
    (customer ? (asString((customer as any).phone) ?? asString((customer as any).cell)) : undefined);

  const customerId = asId(raw.customer_id) ?? (customer ? asId(customer.id) : undefined);

  return { customerId, customerName, customerEmail, customerPhone };
}

function deriveStageFromChecklist(checklist: unknown): DashboardStage | undefined {
  if (!isRecord(checklist)) return undefined;
  const c = checklist as any;

  // We don't know exact field names for every key; these are best-effort.
  const truthy = (v: unknown) => v === true || v === "true" || v === 1;
  const hasDate = (v: unknown) => typeof v === "string" && v.length >= 8;

  if (truthy(c.deleted) || hasDate(c.date_deleted)) return "deleted";
  if (truthy(c.rejected) || hasDate(c.date_rejected)) return "rejected";
  if (truthy(c.closed) || hasDate(c.date_closed)) return "closed";
  if (truthy(c.roof_complete) || hasDate(c.date_roof_complete)) return "roof_complete";
  if (truthy(c.approved) || hasDate(c.date_approved)) return "approved";
  if (truthy(c.submitted) || hasDate(c.date_submitted)) return "submitted";
  if (truthy(c.contract_signed) || hasDate(c.date_signed) || hasDate(c.date_contract_signed))
    return "contract_signed";
  if (truthy(c.estimate_created) || hasDate(c.date_estimate_created)) return "estimate_created";
  if (truthy(c.measured) || hasDate(c.date_measured)) return "measured";
  if (truthy(c.claim_filed) || hasDate(c.date_claim_filed)) return "claim_filed";
  if (truthy(c.inspection_complete) || hasDate(c.date_inspection_complete)) return "inspection_complete";
  if (truthy(c.inspection_scheduled) || hasDate(c.date_inspection_scheduled))
    return "inspection_scheduled";
  if (truthy(c.assigned) || hasDate(c.date_assigned)) return "assigned";
  if (truthy(c.verified) || truthy(c.verify_lead) || hasDate(c.date_verified)) return "lead_verified";

  return undefined;
}

export function normalizeProspect(
  raw: unknown,
  extras?: { checklist?: unknown },
): NormalizedJob | null {
  if (!isRecord(raw)) return null;
  const r = raw as Record<string, unknown>;

  const id = asId(r.id ?? (r as any).job_id);
  if (!id) return null;

  const statusCode = asString(r.status_code ?? (r as any).status) as ProspectStatusCode | undefined;
  const stageFromStatus = statusCode && (PROSPECT_STATUS_MAP as any)[statusCode];
  const stageFromChecklist = deriveStageFromChecklist(extras?.checklist);

  const { customerId, customerName, customerEmail, customerPhone } = getCustomerInfo(r);

  return {
    id,
    sourceType: "prospect",
    jobNumber: asString(r.job_number ?? (r as any).number),
    name: asString(r.name ?? (r as any).job_name ?? (r as any).title),
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    fullAddress: asString(r.full_address ?? (r as any).address),
    region: asString((r as any).region),
    leadSource: asString((r as any).lead_source ?? (r as any).source_name),
    rep: asString((r as any).rep ?? (r as any).rep_name),
    altRep: asString((r as any).alt_rep ?? (r as any).alt_rep_name),
    marketingRep: asString((r as any).marketing_rep ?? (r as any).marketing_rep_name),
    projectManager: asString((r as any).project_manager ?? (r as any).pm_name),
    jobType: asString((r as any).job_type),
    bidType: asString((r as any).bid_type),
    currentStatus: statusCode ?? asString((r as any).status_display),
    stage: stageFromChecklist ?? stageFromStatus,
    dateCreated: asString((r as any).date_created ?? (r as any).created_at),
    dateLastEdited: asString((r as any).date_last_edited ?? (r as any).updated_at),
    pipeline: (r as any).pipeline ?? null,
    checklist: extras?.checklist ?? null,
    raw: { ...r, _extras: extras ?? null },
  };
}

export function normalizeApprovedJob(
  raw: unknown,
  extras?: { checklist?: unknown; quickChecklist?: unknown },
): NormalizedJob | null {
  if (!isRecord(raw)) return null;
  const r = raw as Record<string, unknown>;
  const id = asId(r.id ?? (r as any).job_id);
  if (!id) return null;

  const { customerId, customerName, customerEmail, customerPhone } = getCustomerInfo(r);
  const stage = deriveStageFromChecklist(extras?.checklist) ?? "approved";

  return {
    id,
    sourceType: "approved",
    jobNumber: asString((r as any).job_number ?? (r as any).number),
    name: asString(r.name ?? (r as any).job_name ?? (r as any).title),
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    fullAddress: asString((r as any).full_address ?? (r as any).address),
    region: asString((r as any).region),
    leadSource: asString((r as any).lead_source ?? (r as any).source_name),
    rep: asString((r as any).rep ?? (r as any).rep_name),
    altRep: asString((r as any).alt_rep ?? (r as any).alt_rep_name),
    marketingRep: asString((r as any).marketing_rep ?? (r as any).marketing_rep_name),
    projectManager: asString((r as any).project_manager ?? (r as any).pm_name),
    jobType: asString((r as any).job_type),
    bidType: asString((r as any).bid_type),
    currentStatus: asString((r as any).status ?? (r as any).status_code),
    stage,
    dateCreated: asString((r as any).date_created ?? (r as any).created_at),
    dateLastEdited: asString((r as any).date_last_edited ?? (r as any).updated_at),
    dateSigned: asString((r as any).date_signed ?? (r as any).contract_signed_date),
    dateApproved: asString((r as any).date_approved),
    dateRoofComplete: asString((r as any).date_roof_complete),
    dateClosed: asString((r as any).date_closed),
    checklist: extras?.checklist ?? null,
    pipeline: (r as any).pipeline ?? null,
    raw: { ...r, _extras: extras ?? null },
  };
}

