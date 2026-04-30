"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import {
  SCORECARD_DEMO_DATA,
  SCORECARD_DEMO_STANDARDS,
  SCORECARD_MARKETS,
  SCORECARD_METRICS,
  SCORECARD_REPORTING_DATES,
  type MetricDefinition,
  type ScorecardMarket,
  type ScorecardMarketWithOverall,
  type ScorecardWeekRow,
} from "@/lib/scorecard-demo-data";
import {
  calculateAnnualActual,
  calculateAnnualStandard,
  calculateMetricStatus,
  calculateQuarterActual,
  calculateQuarterStandard,
  calculateRatioMetric,
  calculateRequiredWeeklyPace,
  calculateYtdStandard,
  formatMetricValue,
  latestNonNull,
} from "@/lib/scorecard-calculations";
import {
  SCORECARD_REPORTING_DATES as SCORECARD_REPORTING_DATES_SHEET,
  SCORECARD_SHEET,
  type ScorecardLocation,
  type SheetMetric,
} from "@/lib/scorecard-sheet-data";

type Quarter = 1 | 2 | 3 | 4;

function isQuarter(n: number): n is Quarter {
  return n === 1 || n === 2 || n === 3 || n === 4;
}

function sumWeeks(weeks: ScorecardWeekRow[], slug: string) {
  return weeks.reduce((acc, w) => acc + (Number(w[slug] ?? 0) || 0), 0);
}

function getQuarterWeeks(
  year: number,
  market: ScorecardMarket,
  quarter: Quarter,
): ScorecardWeekRow[] {
  return SCORECARD_DEMO_DATA?.[year]?.[market]?.[quarter] ?? Array.from({ length: 13 }, () => ({}));
}

function buildByQuarter(year: number, market: ScorecardMarket) {
  return {
    1: getQuarterWeeks(year, market, 1),
    2: getQuarterWeeks(year, market, 2),
    3: getQuarterWeeks(year, market, 3),
    4: getQuarterWeeks(year, market, 4),
  } as Record<number, ScorecardWeekRow[]>;
}

function mergeOverallWeeks(year: number, quarter: Quarter) {
  const weeks: ScorecardWeekRow[] = Array.from({ length: 13 }, () => ({}));
  for (let i = 0; i < 13; i++) {
    const merged: ScorecardWeekRow = {};
    for (const m of SCORECARD_METRICS) {
      if (!m.active) continue;
      if (m.calculationType === "RATIO") continue; // computed later

      if (m.calculationType === "SNAPSHOT") {
        // Overall snapshot uses latest non-null across markets for that week index (or null)
        const values = SCORECARD_MARKETS.map((market) => {
          const w = getQuarterWeeks(year, market, quarter)[i];
          return (w?.[m.slug] as any) ?? null;
        });
        merged[m.slug] = latestNonNull(values.map((v) => (v === 0 ? 0 : v)));
      } else {
        const v = SCORECARD_MARKETS.reduce((acc, market) => {
          const w = getQuarterWeeks(year, market, quarter)[i];
          return acc + (Number(w?.[m.slug] ?? 0) || 0);
        }, 0);
        merged[m.slug] = v;
      }
    }
    weeks[i] = merged;
  }
  return weeks;
}

function getMarketWeeks(
  year: number,
  market: ScorecardMarketWithOverall,
  quarter: Quarter,
) {
  if (market === "Overall") return mergeOverallWeeks(year, quarter);
  return getQuarterWeeks(year, market, quarter);
}

function getQuarterReportingDates(year: number, quarter: Quarter) {
  return (
    SCORECARD_REPORTING_DATES?.[year]?.[quarter] ??
    Array.from({ length: 13 }, (_, i) => `W${i + 1}`)
  );
}

function calcOverallStandards(year: number, metricSlug: string, quarter?: Quarter) {
  // Overall standards are summed from markets (simple mock logic)
  if (quarter) {
    return SCORECARD_MARKETS.reduce(
      (acc, m) =>
        acc +
        calculateQuarterStandard(SCORECARD_DEMO_STANDARDS, year, m, metricSlug, quarter),
      0,
    );
  }
  return SCORECARD_MARKETS.reduce(
    (acc, m) => acc + calculateAnnualStandard(SCORECARD_DEMO_STANDARDS, year, m, metricSlug),
    0,
  );
}

function getQuarterReportingDatesSheet(year: number, quarter: Quarter) {
  return (
    SCORECARD_REPORTING_DATES_SHEET?.[String(year)]?.[String(quarter)] ??
    Array.from({ length: 13 }, (_, i) => `W${i + 1}`)
  );
}

function getSheetMetric(year: number, location: ScorecardLocation, metricSlug: string): SheetMetric | null {
  return SCORECARD_SHEET?.[String(year)]?.[location]?.[metricSlug] ?? null;
}

function formatMaybe(metric: MetricDefinition, value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return formatMetricValue(value, metric.displayFormat);
}

function ScorecardPageDemo() {
  const years = useMemo(() => Object.keys(SCORECARD_DEMO_DATA).map((y) => Number(y)).sort(), []);
  const [year, setYear] = useState<number>(years[0] ?? 2026);
  const [quarter, setQuarter] = useState<Quarter>(1);
  const [market, setMarket] = useState<ScorecardMarketWithOverall>("Overall");
  const [week, setWeek] = useState<number>(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const marketsToShow = useMemo(() => {
    if (market === "Overall") return [...SCORECARD_MARKETS, "Overall"] as ScorecardMarketWithOverall[];
    return [market, "Overall"] as ScorecardMarketWithOverall[];
  }, [market]);

  const weeksForSelected = useMemo(() => getMarketWeeks(year, market, quarter), [year, market, quarter]);
  const reportingDates = useMemo(() => getQuarterReportingDates(year, quarter), [year, quarter]);
  const byQuarterSelected = useMemo(() => {
    if (market === "Overall") {
      return {
        1: mergeOverallWeeks(year, 1),
        2: mergeOverallWeeks(year, 2),
        3: mergeOverallWeeks(year, 3),
        4: mergeOverallWeeks(year, 4),
      };
    }
    return buildByQuarter(year, market);
  }, [year, market]);

  const elapsedWeeks = Math.min(13, Math.max(0, week));

  const kpi = useMemo(() => {
    const getMetric = (slug: string) => SCORECARD_METRICS.find((m) => m.slug === slug)!;

    const sold = getMetric("sold_revenue");
    const built = getMetric("built_revenue");
    const contracts = getMetric("contracts");
    const closing = getMetric("closing_pct");
    const leadConv = getMetric("lead_conversion_pct");
    const backlog = getMetric("backlog");

    const quarterActualSold =
      sold.calculationType === "SUM"
        ? sumWeeks(weeksForSelected, sold.slug)
        : 0;
    const quarterStandardSold =
      market === "Overall"
        ? calcOverallStandards(year, sold.slug, quarter)
        : calculateQuarterStandard(SCORECARD_DEMO_STANDARDS, year, market as ScorecardMarket, sold.slug, quarter);

    const quarterActualBuilt = sumWeeks(weeksForSelected, built.slug);
    const quarterStandardBuilt =
      market === "Overall"
        ? calcOverallStandards(year, built.slug, quarter)
        : calculateQuarterStandard(SCORECARD_DEMO_STANDARDS, year, market as ScorecardMarket, built.slug, quarter);

    const quarterActualContracts = sumWeeks(weeksForSelected, contracts.slug);
    const quarterStandardContracts =
      market === "Overall"
        ? calcOverallStandards(year, contracts.slug, quarter)
        : calculateQuarterStandard(SCORECARD_DEMO_STANDARDS, year, market as ScorecardMarket, contracts.slug, quarter);

    const closingPct = calculateRatioMetric(closing, byQuarterSelected, SCORECARD_METRICS, {
      scope: "quarter",
      quarter,
    });
    const leadConvPct = calculateRatioMetric(leadConv, byQuarterSelected, SCORECARD_METRICS, {
      scope: "quarter",
      quarter,
    });
    const backlogVal = latestNonNull(weeksForSelected.map((w) => (w[backlog.slug] as any) ?? null));

    return {
      sold: { actual: quarterActualSold, standard: quarterStandardSold, metric: sold },
      built: { actual: quarterActualBuilt, standard: quarterStandardBuilt, metric: built },
      contracts: { actual: quarterActualContracts, standard: quarterStandardContracts, metric: contracts },
      closing: { actual: closingPct, standard: 0.25, metric: closing }, // mock
      leadConv: { actual: leadConvPct, standard: 0.35, metric: leadConv }, // mock
      backlog: { actual: backlogVal, standard: 0, metric: backlog }, // backlog is "higher is better"; standard mocked as 0
    };
  }, [weeksForSelected, market, year, quarter, byQuarterSelected]);

  const tableMetrics = useMemo(
    () => SCORECARD_METRICS.filter((m) => m.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  const soldChartData = useMemo(() => {
    const slug = "sold_revenue";
    const data = weeksForSelected.map((w, idx) => ({
      week: reportingDates[idx] ?? `W${idx + 1}`,
      value: Number(w[slug] ?? 0) || 0,
    }));
    return data;
  }, [weeksForSelected, reportingDates]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Browns Roofing Scorecard</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Manual weekly reporting by market (Overall is calculated).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60 dark:text-white/60">Year</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60 dark:text-white/60">Quarter</span>
              <select
                value={quarter}
                onChange={(e) => {
                  const q = Number(e.target.value);
                  if (isQuarter(q)) setQuarter(q);
                }}
                className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60 dark:text-white/60">Market</span>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as ScorecardMarketWithOverall)}
                className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
              >
                {[...SCORECARD_MARKETS, "Overall"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60 dark:text-white/60">Week</span>
              <select
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
              >
                {reportingDates.map((label, idx) => {
                  const w = idx + 1;
                  return (
                    <option key={label} value={w}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { title: "Sold Revenue vs Standard", data: kpi.sold },
            { title: "Built Revenue vs Standard", data: kpi.built },
            { title: "Contracts vs Standard", data: kpi.contracts },
            { title: "Closing %", data: kpi.closing },
            { title: "Lead Conversion %", data: kpi.leadConv },
            { title: "Backlog", data: kpi.backlog },
          ].map((card) => {
            const status = calculateMetricStatus({
              actual: card.data.actual,
              standard: card.data.standard,
              comparisonDirection: card.data.metric.comparisonDirection,
            });
            return (
              <div
                key={card.title}
                className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 py-3"
              >
                <div className="text-xs text-black/60 dark:text-white/60">{card.title}</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-lg font-semibold">
                    {formatMetricValue(card.data.actual, card.data.metric.displayFormat)}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      status === "green" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {card.data.standard
                      ? `Std ${formatMetricValue(card.data.standard, card.data.metric.displayFormat)}`
                      : "Std —"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/15">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10 text-xs text-black/60 dark:text-white/60">
              <tr>
                <th className="px-3 py-3 text-left font-medium">Metric</th>
                <th className="px-3 py-3 text-right font-medium">Annual Std</th>
                <th className="px-3 py-3 text-right font-medium">Annual Actual</th>
                <th className="px-3 py-3 text-right font-medium">YTD Std</th>
                <th className="px-3 py-3 text-right font-medium">Quarter Actual</th>
                <th className="px-3 py-3 text-right font-medium">Qtr Std</th>
                <th className="px-3 py-3 text-right font-medium">Req Weekly Pace</th>
                {reportingDates.map((label, idx) => (
                  <th key={label + idx} className="px-3 py-3 text-right font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marketsToShow.map((mkt) => (
                <MarketBlock
                  key={mkt}
                  year={year}
                  quarter={quarter}
                  elapsedWeeks={elapsedWeeks}
                  market={mkt}
                  metrics={tableMetrics}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div className="font-semibold">Sold Revenue by week</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                {market} • Q{quarter} • {year}
              </div>
            </div>
            <div className="h-72">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={soldChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
            <div className="font-semibold">Market comparison (Sold Revenue)</div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-black/60 dark:text-white/60">
                  <tr>
                    <th className="py-2 text-left font-medium">Market</th>
                    <th className="py-2 text-right font-medium">Quarter Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {[...SCORECARD_MARKETS, "Overall" as const].map((mkt) => {
                    const weeks = getMarketWeeks(year, mkt, quarter);
                    const actual = sumWeeks(weeks, "sold_revenue");
                    return (
                      <tr key={mkt} className="border-t border-black/5 dark:border-white/10">
                        <td className="py-2">{mkt}</td>
                        <td className="py-2 text-right tabular-nums">
                          {formatMetricValue(actual, "currency")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketBlock(props: {
  year: number;
  quarter: Quarter;
  elapsedWeeks: number;
  market: ScorecardMarketWithOverall;
  metrics: MetricDefinition[];
}) {
  const weeks = getMarketWeeks(props.year, props.market, props.quarter);
  const byQuarter =
    props.market === "Overall"
      ? {
          1: mergeOverallWeeks(props.year, 1),
          2: mergeOverallWeeks(props.year, 2),
          3: mergeOverallWeeks(props.year, 3),
          4: mergeOverallWeeks(props.year, 4),
        }
      : buildByQuarter(props.year, props.market);

  return (
    <>
      <tr className="bg-black/5 dark:bg-white/10">
        <td colSpan={7 + 13} className="px-3 py-2 text-sm font-semibold">
          {props.market}
        </td>
      </tr>
      {props.metrics.map((metric) => {
        const annualActual =
          props.market === "Overall"
            ? calculateAnnualActual(metric, byQuarter, SCORECARD_METRICS)
            : calculateAnnualActual(metric, byQuarter, SCORECARD_METRICS);

        const annualStd =
          props.market === "Overall"
            ? calcOverallStandards(props.year, metric.slug)
            : calculateAnnualStandard(SCORECARD_DEMO_STANDARDS, props.year, props.market, metric.slug);

        const quarterActual = calculateQuarterActual(
          metric,
          weeks,
          props.quarter,
          byQuarter,
          SCORECARD_METRICS,
        );

        const quarterStd =
          props.market === "Overall"
            ? calcOverallStandards(props.year, metric.slug, props.quarter)
            : calculateQuarterStandard(SCORECARD_DEMO_STANDARDS, props.year, props.market, metric.slug, props.quarter);

        const ytdStd =
          props.market === "Overall"
            ? // sum market YTD standards (simple)
              SCORECARD_MARKETS.reduce(
                (acc, m) =>
                  acc +
                  calculateYtdStandard({
                    standards: SCORECARD_DEMO_STANDARDS,
                    year: props.year,
                    market: m,
                    metricSlug: metric.slug,
                    currentQuarter: props.quarter,
                    elapsedWeeks: props.elapsedWeeks,
                  }),
                0,
              )
            : calculateYtdStandard({
                standards: SCORECARD_DEMO_STANDARDS,
                year: props.year,
                market: props.market,
                metricSlug: metric.slug,
                currentQuarter: props.quarter,
                elapsedWeeks: props.elapsedWeeks,
              });

        const reqWeekly = calculateRequiredWeeklyPace({
          adjustedQuarterStandard: quarterStd,
          quarterActualToDate:
            metric.calculationType === "SNAPSHOT"
              ? latestNonNull(weeks.slice(0, props.elapsedWeeks).map((w) => (w[metric.slug] as any) ?? null))
              : weeks.slice(0, props.elapsedWeeks).reduce((acc, w) => acc + (Number(w[metric.slug] ?? 0) || 0), 0),
          elapsedWeeks: props.elapsedWeeks,
        });

        const status = calculateMetricStatus({
          actual: quarterActual,
          standard: quarterStd,
          comparisonDirection: metric.comparisonDirection,
        });

        return (
          <tr key={`${props.market}-${metric.slug}`} className="border-t border-black/5 dark:border-white/10">
            <td className="px-3 py-2">
              <div className="font-medium">{metric.name}</div>
              <div className="text-xs text-black/60 dark:text-white/60">{metric.category}</div>
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatMetricValue(annualStd, metric.displayFormat)}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatMetricValue(annualActual, metric.displayFormat)}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatMetricValue(ytdStd, metric.displayFormat)}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <span className={status === "green" ? "text-emerald-600" : "text-red-600"}>
                {formatMetricValue(quarterActual, metric.displayFormat)}
              </span>
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatMetricValue(quarterStd, metric.displayFormat)}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatMetricValue(reqWeekly, metric.displayFormat)}
            </td>
            {weeks.map((w, idx) => {
              const raw = (w as any)?.[metric.slug];
              const hasValue = raw !== null && raw !== undefined && raw !== "";
              const val = hasValue ? Number(raw) : null;
              const isEditable = metric.calculationType === "SUM" || metric.calculationType === "SNAPSHOT" || metric.calculationType === "MANUAL";
              const isReadOnly = metric.calculationType === "RATIO";
              return (
                <td key={idx} className="px-3 py-2 text-right tabular-nums">
                  <span
                    className={
                      isReadOnly
                        ? "text-black/50 dark:text-white/50"
                        : isEditable
                          ? "rounded-md bg-black/5 dark:bg-white/10 px-1.5 py-0.5"
                          : ""
                    }
                  >
                    {metric.displayFormat === "currency"
                      ? hasValue
                        ? formatMetricValue(Number(val ?? 0), "currency")
                        : "—"
                      : metric.displayFormat === "percentage"
                        ? "—"
                        : hasValue
                          ? formatMetricValue(Number(val ?? 0), "number")
                          : "—"}
                  </span>
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}

export default function ScorecardPage() {
  const years = useMemo(() => Object.keys(SCORECARD_SHEET).map((y) => Number(y)).sort(), []);
  const [year, setYear] = useState<number>(years[0] ?? 2026);

  const tableMetrics = useMemo(
    () => SCORECARD_METRICS.filter((m) => m.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  const quarters: Quarter[] = [1, 2, 3, 4];
  const locations: ScorecardLocation[] = ["Baton Rouge", "Monroe", "Shreveport", "Arkansas", "Kansas", "Overall"];

  function statusClass(actual: number | null | undefined, goal: number | null | undefined) {
    if (actual === null || actual === undefined) return "";
    if (goal === null || goal === undefined) return "";
    return actual >= goal
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  const reportingAll = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const q of quarters) map[String(q)] = getQuarterReportingDatesSheet(year, q);
    return map as Record<string, string[]>;
  }, [year]);

  function sumAcrossLocations(metricSlug: string, quarter: Quarter, weekIdx: number) {
    let total = 0;
    for (const loc of locations) {
      if (loc === "Overall") continue;
      const sm = getSheetMetric(year, loc, metricSlug);
      const v = sm?.weeks?.[String(quarter)]?.[weekIdx];
      if (typeof v === "number" && !Number.isNaN(v)) total += v;
    }
    return total;
  }

  function sumAcrossLocationsQuarterActual(metricSlug: string, quarter: Quarter) {
    let total = 0;
    for (const loc of locations) {
      if (loc === "Overall") continue;
      const sm = getSheetMetric(year, loc, metricSlug);
      const v = sm?.quarterActual?.[String(quarter)];
      if (typeof v === "number" && !Number.isNaN(v)) total += v;
    }
    return total;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Browns Roofing Scorecard</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Spreadsheet-exact manual scorecard (values pulled directly from the Excel export).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60 dark:text-white/60">Year</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-black/10 dark:border-white/15 bg-white/60 dark:bg-white/5">
          <div className="overflow-auto">
            <table className="w-full min-w-[2400px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-white/90 dark:bg-black/30 backdrop-blur">
                <tr className="text-xs text-black/60 dark:text-white/60">
                  <th rowSpan={2} className="px-3 py-2 text-left font-medium">
                    Metric
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-right font-medium">
                    Annual Std
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-right font-medium">
                    Annual Act
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-right font-medium">
                    YTD Std
                  </th>
                  {quarters.map((q) => (
                    <th key={q} colSpan={2 + 13} className="px-3 py-2 text-center font-medium">
                      Q{q}
                    </th>
                  ))}
                </tr>
                <tr className="text-xs text-black/60 dark:text-white/60">
                  {quarters.map((q) => (
                    <>
                      <th key={`q${q}-act`} className="px-3 py-2 text-right font-medium">
                        Act
                      </th>
                      <th key={`q${q}-goal`} className="px-3 py-2 text-right font-medium">
                        Weekly Goal
                      </th>
                      {reportingAll[String(q)].map((d) => (
                        <th key={`q${q}-${d}`} className="px-3 py-2 text-right font-medium">
                          {d}
                        </th>
                      ))}
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <>
                    <tr key={`${loc}-hdr`} className="bg-black/5 dark:bg-white/10">
                      <td colSpan={4 + quarters.length * (2 + 13)} className="px-3 py-2 text-sm font-semibold">
                        {loc}
                      </td>
                    </tr>
                    {tableMetrics.map((metric) => {
                      const sm = getSheetMetric(year, loc, metric.slug);
                      const annualTint = statusClass(sm?.annualActual ?? null, sm?.annualStandard ?? null);

                      return (
                        <tr key={`${loc}-${metric.slug}`} className="border-t border-black/5 dark:border-white/10">
                          <td className="px-3 py-2 text-left">
                            <div className="font-medium">{metric.name}</div>
                            <div className="text-[11px] text-black/50 dark:text-white/50">{metric.category}</div>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatMaybe(metric, sm?.annualStandard)}</td>
                          <td className={`px-3 py-2 text-right tabular-nums ${annualTint}`}>
                            {formatMaybe(metric, sm?.annualActual)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatMaybe(metric, sm?.ytdStandard)}</td>
                          {quarters.map((q) => {
                            const qKey = String(q);
                            const qAct = sm?.quarterActual?.[qKey];
                            const qGoal = sm?.quarterWeeklyStandard?.[qKey];
                            const qActTint =
                              metric.calculationType === "RATIO"
                                ? statusClass(qAct ?? null, sm?.annualStandard ?? null)
                                : statusClass(qAct ?? null, qGoal != null ? qGoal * 13 : null);

                            const weeks = sm?.weeks?.[qKey] ?? Array.from({ length: 13 }, () => null);
                            return (
                              <>
                                <td key={`${loc}-${metric.slug}-q${q}-act`} className={`px-3 py-2 text-right tabular-nums ${qActTint}`}>
                                  {formatMaybe(metric, qAct)}
                                </td>
                                <td key={`${loc}-${metric.slug}-q${q}-goal`} className="px-3 py-2 text-right tabular-nums">
                                  {formatMaybe(metric, qGoal)}
                                </td>
                                {weeks.map((v, idx) => (
                                  <td
                                    key={`${loc}-${metric.slug}-q${q}-w${idx}`}
                                    className={`px-3 py-2 text-right tabular-nums ${statusClass(v ?? null, qGoal ?? null)}`}
                                  >
                                    {formatMaybe(metric, v)}
                                  </td>
                                ))}
                              </>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
              <tfoot>
                {(["sold_revenue", "built_revenue"] as const).map((slug) => {
                  const metric = tableMetrics.find((m) => m.slug === slug);
                  if (!metric) return null;
                  return (
                    <tr key={`totals-${slug}`} className="border-t border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/10">
                      <td className="px-3 py-2 font-semibold">Totals (all locations): {metric.name}</td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      {quarters.map((q) => (
                        <>
                          <td key={`tot-${slug}-q${q}-act`} className="px-3 py-2 text-right tabular-nums font-semibold">
                            {formatMaybe(metric, sumAcrossLocationsQuarterActual(slug, q))}
                          </td>
                          <td key={`tot-${slug}-q${q}-goal`} className="px-3 py-2" />
                          {Array.from({ length: 13 }, (_, idx) => (
                            <td
                              key={`tot-${slug}-q${q}-w${idx}`}
                              className="px-3 py-2 text-right tabular-nums font-semibold"
                            >
                              {formatMaybe(metric, sumAcrossLocations(slug, q, idx))}
                            </td>
                          ))}
                        </>
                      ))}
                    </tr>
                  );
                })}
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

