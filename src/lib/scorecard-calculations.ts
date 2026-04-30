import type {
  ComparisonDirection,
  MetricDefinition,
  MetricDisplayFormat,
  ScorecardMarket,
  ScorecardMarketWithOverall,
  ScorecardStandards,
  ScorecardWeekRow,
} from "@/lib/scorecard-demo-data";

export function latestNonNull(values: Array<number | null | undefined>) {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v !== null && v !== undefined) return v;
  }
  return 0;
}

export function calculateAnnualActual(
  metric: MetricDefinition,
  byQuarter: Record<number, ScorecardWeekRow[]>,
  allMetrics: MetricDefinition[],
) {
  if (metric.calculationType === "RATIO") {
    // build from annual totals
    return calculateRatioMetric(metric, byQuarter, allMetrics, { scope: "annual" });
  }
  if (metric.calculationType === "SNAPSHOT") {
    const allWeeks = [1, 2, 3, 4].flatMap((q) => byQuarter[q] ?? []);
    return latestNonNull(allWeeks.map((w) => (w[metric.slug] as any) ?? null));
  }
  // SUM / MANUAL
  const allWeeks = [1, 2, 3, 4].flatMap((q) => byQuarter[q] ?? []);
  return allWeeks.reduce((acc, w) => acc + (Number(w[metric.slug] ?? 0) || 0), 0);
}

export function calculateQuarterActual(
  metric: MetricDefinition,
  weeks: ScorecardWeekRow[],
  quarterIndex: number,
  byQuarter: Record<number, ScorecardWeekRow[]>,
  allMetrics: MetricDefinition[],
) {
  if (metric.calculationType === "RATIO") {
    return calculateRatioMetric(metric, byQuarter, allMetrics, { scope: "quarter", quarter: quarterIndex });
  }
  if (metric.calculationType === "SNAPSHOT") {
    return latestNonNull(weeks.map((w) => (w[metric.slug] as any) ?? null));
  }
  return weeks.reduce((acc, w) => acc + (Number(w[metric.slug] ?? 0) || 0), 0);
}

export function calculateRatioMetric(
  metric: MetricDefinition,
  byQuarter: Record<number, ScorecardWeekRow[]>,
  allMetrics: MetricDefinition[],
  scope:
    | { scope: "week"; quarter: number; weekIndex: number }
    | { scope: "quarter"; quarter: number }
    | { scope: "annual" },
) {
  const cfg = metric.formulaConfig;
  if (!cfg) return 0;

  const numeratorSlug = cfg.numeratorSlug;
  const denomSlugs = cfg.denominatorSlugs;

  const sumForSlug = (slug: string, weeks: ScorecardWeekRow[]) =>
    weeks.reduce((acc, w) => acc + (Number(w[slug] ?? 0) || 0), 0);

  let numerator = 0;
  let denominator = 0;

  if (scope.scope === "week") {
    const week = (byQuarter[scope.quarter] ?? [])[scope.weekIndex];
    numerator = Number(week?.[numeratorSlug] ?? 0) || 0;
    denominator = denomSlugs.reduce((acc, s) => acc + (Number(week?.[s] ?? 0) || 0), 0);
  } else if (scope.scope === "quarter") {
    const weeks = byQuarter[scope.quarter] ?? [];
    numerator = sumForSlug(numeratorSlug, weeks);
    denominator = denomSlugs.reduce((acc, s) => acc + sumForSlug(s, weeks), 0);
  } else {
    const weeks = [1, 2, 3, 4].flatMap((q) => byQuarter[q] ?? []);
    numerator = sumForSlug(numeratorSlug, weeks);
    denominator = denomSlugs.reduce((acc, s) => acc + sumForSlug(s, weeks), 0);
  }

  if (!denominator) return 0;
  return numerator / denominator;
}

export function calculateQuarterStandard(
  standards: ScorecardStandards,
  year: number,
  market: ScorecardMarket,
  metricSlug: string,
  quarter: number,
) {
  const m = standards?.[year]?.[market]?.[metricSlug];
  if (!m) return 0;
  if (quarter === 1) return Number(m.q1Standard ?? 0) || 0;
  if (quarter === 2) return Number(m.q2Standard ?? 0) || 0;
  if (quarter === 3) return Number(m.q3Standard ?? 0) || 0;
  if (quarter === 4) return Number(m.q4Standard ?? 0) || 0;
  return 0;
}

export function calculateAnnualStandard(
  standards: ScorecardStandards,
  year: number,
  market: ScorecardMarket,
  metricSlug: string,
) {
  const m = standards?.[year]?.[market]?.[metricSlug];
  return Number(m?.annualStandard ?? 0) || 0;
}

export function calculateYtdStandard(args: {
  standards: ScorecardStandards;
  year: number;
  market: ScorecardMarket;
  metricSlug: string;
  currentQuarter: number;
  elapsedWeeks: number; // 0..13
  totalWeeksInQuarter?: number;
}) {
  const totalWeeks = args.totalWeeksInQuarter ?? 13;
  const m = args.standards?.[args.year]?.[args.market]?.[args.metricSlug];
  if (!m) return 0;

  if (typeof m.ytdStandardOverride === "number") return m.ytdStandardOverride;

  const priorQuarters = [1, 2, 3, 4].filter((q) => q < args.currentQuarter);
  const prior = priorQuarters.reduce(
    (acc, q) => acc + calculateQuarterStandard(args.standards, args.year, args.market, args.metricSlug, q),
    0,
  );

  const currentQuarterStandard = calculateQuarterStandard(
    args.standards,
    args.year,
    args.market,
    args.metricSlug,
    args.currentQuarter,
  );
  const prorated = currentQuarterStandard * (Math.min(Math.max(args.elapsedWeeks, 0), totalWeeks) / totalWeeks);
  return prior + prorated;
}

export function calculateRequiredWeeklyPace(args: {
  adjustedQuarterStandard: number;
  quarterActualToDate: number;
  elapsedWeeks: number;
  totalWeeks?: number;
}) {
  const totalWeeks = args.totalWeeks ?? 13;
  const remainingWeeks = Math.max(0, totalWeeks - Math.min(totalWeeks, Math.max(args.elapsedWeeks, 0)));
  if (remainingWeeks === 0) return 0;
  const remainingTarget = args.adjustedQuarterStandard - args.quarterActualToDate;
  return remainingTarget / remainingWeeks;
}

export function calculateMetricStatus(args: {
  actual: number;
  standard: number;
  comparisonDirection: ComparisonDirection;
}) {
  if (args.comparisonDirection === "LOWER_IS_BETTER") {
    return args.actual <= args.standard ? "green" : "red";
  }
  return args.actual >= args.standard ? "green" : "red";
}

export function formatMetricValue(value: number, format: MetricDisplayFormat) {
  if (format === "currency") {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === "percentage") {
    return new Intl.NumberFormat(undefined, {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

