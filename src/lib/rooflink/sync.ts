import { fetchAllPaginated } from "@/lib/rooflink/client";
import {
  getJob,
  getJobChecklist,
  getJobQuickChecklist,
  getProspectChecklist,
  getProspectJob,
  listApprovedJobs,
  listProspectJobs,
} from "@/lib/rooflink/endpoints";

export async function syncProspects(options: { pageSize?: number; maxPages?: number } = {}) {
  const { results, count } = await fetchAllPaginated(
    ({ page, page_size }) =>
      listProspectJobs({
        page,
        page_size,
        date_deleted__isnull: true,
      }),
    { pageSize: options.pageSize ?? 10, maxPages: options.maxPages ?? 500 },
  );
  return { results, count };
}

export async function syncApprovedJobs(options: { pageSize?: number; maxPages?: number } = {}) {
  const { results, count } = await fetchAllPaginated(
    ({ page, page_size }) => listApprovedJobs({ page, page_size }),
    { pageSize: options.pageSize ?? 100, maxPages: options.maxPages ?? 500 },
  );
  return { results, count };
}

export async function hydrateProspectDetails(ids: Array<number | string>) {
  return await Promise.all(ids.map((id) => getProspectJob(id)));
}

export async function hydrateJobDetails(ids: Array<number | string>) {
  return await Promise.all(ids.map((id) => getJob(id)));
}

export async function hydrateChecklists(ids: Array<number | string>) {
  return await Promise.all(
    ids.map(async (id) => {
      const [checklist, quick] = await Promise.all([
        getJobChecklist(id).catch(() => null),
        getJobQuickChecklist(id).catch(() => null),
      ]);
      return { id, checklist, quick };
    }),
  );
}

export async function hydrateProspectChecklists(ids: Array<number | string>) {
  return await Promise.all(
    ids.map(async (id) => {
      const checklist = await getProspectChecklist(id).catch(() => null);
      return { id, checklist };
    }),
  );
}

