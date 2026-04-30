export type ScorecardMarket =
  | "Baton Rouge"
  | "Monroe"
  | "Shreveport"
  | "Arkansas"
  | "Kansas";

export const SCORECARD_MARKETS: ScorecardMarket[] = [
  "Baton Rouge",
  "Monroe",
  "Shreveport",
  "Arkansas",
  "Kansas",
];

export type ScorecardMarketWithOverall = ScorecardMarket | "Overall";

export type MetricDisplayFormat = "number" | "currency" | "percentage";

export type MetricCalculationType = "SUM" | "RATIO" | "SNAPSHOT" | "MANUAL";

export type ComparisonDirection = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";

export type MetricDefinition = {
  name: string;
  slug: string;
  category: string;
  displayFormat: MetricDisplayFormat;
  calculationType: MetricCalculationType;
  comparisonDirection: ComparisonDirection;
  active: boolean;
  sortOrder: number;
  formulaConfig?: {
    numeratorSlug: string;
    denominatorSlugs: string[];
  };
};

export const SCORECARD_METRICS: MetricDefinition[] = [
  {
    name: "Insurance Agent / Real Estate Contacts",
    slug: "contacts",
    category: "Activity",
    displayFormat: "number",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 10,
  },
  {
    name: "Marketing Generated Leads",
    slug: "marketing_generated_leads",
    category: "Leads",
    displayFormat: "number",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 20,
  },
  {
    name: "Door Knocking Leads",
    slug: "door_knocking_leads",
    category: "Leads",
    displayFormat: "number",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 30,
  },
  {
    name: "Inspections Completed",
    slug: "inspections_completed",
    category: "Funnel",
    displayFormat: "number",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 40,
  },
  {
    name: "Presentations",
    slug: "presentations",
    category: "Funnel",
    displayFormat: "number",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 50,
  },
  {
    name: "Lead Conversion %",
    slug: "lead_conversion_pct",
    category: "Funnel",
    displayFormat: "percentage",
    calculationType: "RATIO",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 60,
    formulaConfig: {
      numeratorSlug: "inspections_completed",
      denominatorSlugs: ["door_knocking_leads", "marketing_generated_leads"],
    },
  },
  {
    name: "Contracts",
    slug: "contracts",
    category: "Sales",
    displayFormat: "number",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 70,
  },
  {
    name: "Closing %",
    slug: "closing_pct",
    category: "Sales",
    displayFormat: "percentage",
    calculationType: "RATIO",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 80,
    formulaConfig: {
      numeratorSlug: "contracts",
      denominatorSlugs: ["inspections_completed"],
    },
  },
  {
    name: "Sold Revenue",
    slug: "sold_revenue",
    category: "Revenue",
    displayFormat: "currency",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 90,
  },
  {
    name: "Built Revenue",
    slug: "built_revenue",
    category: "Revenue",
    displayFormat: "currency",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 100,
  },
  {
    name: "Backlog",
    slug: "backlog",
    category: "Ops",
    displayFormat: "currency",
    calculationType: "SNAPSHOT",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 110,
  },
  {
    name: "Accounts Receivable > 90 Days",
    slug: "ar_over_90",
    category: "Finance",
    displayFormat: "currency",
    calculationType: "SNAPSHOT",
    comparisonDirection: "LOWER_IS_BETTER",
    active: true,
    sortOrder: 120,
  },
  {
    name: "5 Star Google Reviews",
    slug: "google_reviews_5_star",
    category: "Reputation",
    displayFormat: "number",
    calculationType: "SUM",
    comparisonDirection: "HIGHER_IS_BETTER",
    active: true,
    sortOrder: 130,
  },
];

export type ScorecardWeekValue = number | null;

export type ScorecardWeekRow = Record<string, ScorecardWeekValue>;

export type ScorecardData = {
  [year: number]: {
    [market in ScorecardMarket]: {
      // quarter => weeks (13) => metric slug => value
      [quarter: number]: ScorecardWeekRow[];
    };
  };
};

function seedQuarterValues(seed: number) {
  // 13 weeks
  const weeks: ScorecardWeekRow[] = Array.from({ length: 13 }, (_, i) => {
    const w = i + 1;
    return {
      contacts: Math.max(0, Math.round(seed + w * 2)),
      marketing_generated_leads: Math.max(0, Math.round(seed / 2 + w)),
      door_knocking_leads: Math.max(0, Math.round(seed / 3 + w * 0.8)),
      inspections_completed: Math.max(0, Math.round(seed / 4 + w * 0.6)),
      presentations: Math.max(0, Math.round(seed / 5 + w * 0.5)),
      contracts: Math.max(0, Math.round(seed / 6 + w * 0.35)),
      sold_revenue: Math.max(0, Math.round((seed * 5000) + w * 12000)),
      built_revenue: Math.max(0, Math.round((seed * 4500) + w * 9000)),
      backlog: w % 3 === 0 ? Math.max(0, Math.round((seed * 80000) + w * 15000)) : null,
      ar_over_90: w % 4 === 0 ? Math.max(0, Math.round((seed * 12000) + w * 2000)) : null,
      google_reviews_5_star: w % 2 === 0 ? Math.max(0, Math.round(seed / 10 + 1)) : 0,
    };
  });

  // leave a couple weeks blank to exercise snapshot/latest logic
  weeks[0] = { ...weeks[0], backlog: null, ar_over_90: null };
  weeks[12] = { ...weeks[12], backlog: weeks[11].backlog ?? weeks[12].backlog, ar_over_90: weeks[11].ar_over_90 ?? weeks[12].ar_over_90 };
  return weeks;
}

export const SCORECARD_DEMO_DATA: ScorecardData = {
  2026: {
    "Baton Rouge": {
      1: seedQuarterValues(22),
      2: seedQuarterValues(26),
      3: seedQuarterValues(24),
      4: seedQuarterValues(28),
    },
    Monroe: {
      1: seedQuarterValues(10),
      2: seedQuarterValues(11),
      3: seedQuarterValues(12),
      4: seedQuarterValues(14),
    },
    Shreveport: {
      1: seedQuarterValues(14),
      2: seedQuarterValues(15),
      3: seedQuarterValues(16),
      4: seedQuarterValues(17),
    },
    Arkansas: {
      1: seedQuarterValues(9),
      2: seedQuarterValues(10),
      3: seedQuarterValues(11),
      4: seedQuarterValues(12),
    },
    Kansas: {
      1: seedQuarterValues(16),
      2: seedQuarterValues(17),
      3: seedQuarterValues(18),
      4: seedQuarterValues(19),
    },
  },
};

export type ScorecardStandards = {
  [year: number]: {
    [market in ScorecardMarket]: {
      [metricSlug: string]: {
        annualStandard: number;
        q1Standard: number;
        q2Standard: number;
        q3Standard: number;
        q4Standard: number;
        ytdStandardOverride?: number;
        weeklyStandardOverride?: number;
        allowCarryForwardShortfall?: boolean;
      };
    };
  };
};

function mkStandards(mult: number) {
  const out: Record<string, any> = {};
  for (const m of SCORECARD_METRICS) {
    if (!m.active) continue;
    const base =
      m.displayFormat === "currency"
        ? 250_000 * mult
        : m.displayFormat === "percentage"
          ? 0.25
          : 120 * mult;
    out[m.slug] = {
      annualStandard: base * 4,
      q1Standard: base,
      q2Standard: base,
      q3Standard: base,
      q4Standard: base,
      allowCarryForwardShortfall: true,
    };
  }
  return out;
}

export const SCORECARD_DEMO_STANDARDS: ScorecardStandards = {
  2026: {
    "Baton Rouge": mkStandards(1.3),
    Monroe: mkStandards(0.7),
    Shreveport: mkStandards(0.9),
    Arkansas: mkStandards(0.6),
    Kansas: mkStandards(1.0),
  },
};

