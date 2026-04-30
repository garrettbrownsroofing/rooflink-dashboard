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

export const SCORECARD_REPORTING_DATES: Record<number, Record<number, string[]>> = {
  2026: {
    1: ["1/5/26", "1/12/26", "1/19/26", "1/26/26", "2/2/26", "2/9/26", "2/16/26", "2/23/26", "3/2/26", "3/9/26", "3/16/26", "3/23/26", "3/30/26"],
    2: ["4/6/26", "4/13/26", "4/20/26", "4/27/26", "5/4/26", "5/11/26", "5/18/26", "5/25/26", "6/1/26", "6/8/26", "6/15/26", "6/22/26", "6/29/26"],
    3: ["7/6/26", "7/13/26", "7/20/26", "7/27/26", "8/3/26", "8/10/26", "8/17/26", "8/24/26", "8/31/26", "9/7/26", "9/14/26", "9/21/26", "9/28/26"],
    4: ["10/5/26", "10/12/26", "10/19/26", "10/26/26", "11/2/26", "11/9/26", "11/16/26", "11/23/26", "11/30/26", "12/7/26", "12/14/26", "12/21/26", "12/28/26"],
  },
};

// Data imported from:
// `/Users/maxwell/Downloads/2026 Residential Sales Manager L-10 .xlsx`
// Sheet: `Residential Scorecard`
//
// Ratio metrics are computed at runtime and are not stored here.
export const SCORECARD_DEMO_DATA: ScorecardData = {
  2026: {
    "Baton Rouge": {
      "1": [
        {
          "contacts": 0,
          "marketing_generated_leads": 0,
          "door_knocking_leads": 0,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 24281,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 3,
          "door_knocking_leads": 0,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 5398,
          "built_revenue": 0,
          "backlog": 5398.18,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 0,
          "door_knocking_leads": 1,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 5398,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 1,
          "door_knocking_leads": 6,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 5398,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 0,
          "door_knocking_leads": 0,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 5398,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 0,
          "door_knocking_leads": 1,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 23157,
          "built_revenue": 0,
          "backlog": 28555,
          "ar_over_90": 0,
          "google_reviews_5_star": 1
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 0,
          "door_knocking_leads": 0,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 5398,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 3,
          "door_knocking_leads": 2,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 5398,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 1,
          "door_knocking_leads": 2,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 5398,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 4,
          "marketing_generated_leads": 0,
          "door_knocking_leads": 1,
          "inspections_completed": 0,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 0,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 5,
          "marketing_generated_leads": 3,
          "door_knocking_leads": 2,
          "inspections_completed": 6,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 0,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 5,
          "marketing_generated_leads": 1,
          "door_knocking_leads": 3,
          "inspections_completed": 5,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 0,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 5,
          "marketing_generated_leads": 0,
          "door_knocking_leads": 0,
          "inspections_completed": 1,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 0,
          "backlog": 0,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        }
      ],
      "2": [
        { "contacts": 5, "marketing_generated_leads": 0, "door_knocking_leads": 1, "inspections_completed": 1, "presentations": 0, "contracts": 1, "sold_revenue": 13560, "built_revenue": 14790, "backlog": 13560, "ar_over_90": 0, "google_reviews_5_star": 0 },
        { "contacts": 3, "marketing_generated_leads": 1, "door_knocking_leads": 1, "inspections_completed": 0, "presentations": 0, "contracts": 2, "sold_revenue": 31006, "built_revenue": 24807, "backlog": 31001, "ar_over_90": 0, "google_reviews_5_star": 0 },
        { "contacts": 3, "marketing_generated_leads": 4, "door_knocking_leads": 0, "inspections_completed": 3, "presentations": 0, "contracts": 1, "sold_revenue": 30000, "built_revenue": 44090, "backlog": 61001, "ar_over_90": 0, "google_reviews_5_star": 0 },
        { "contacts": 2, "marketing_generated_leads": 3, "door_knocking_leads": 2, "inspections_completed": 5, "presentations": 0, "contracts": 0, "sold_revenue": 0, "built_revenue": 20136, "backlog": 10866, "ar_over_90": 0, "google_reviews_5_star": 1 },
        {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      "3": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      "4": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    },
    "Monroe": {
      "1": [
        {
          "contacts": 1,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 5
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 12
        },
        {
          "contacts": 2,
          "marketing_generated_leads": 8,
          "door_knocking_leads": 17
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 21,
          "door_knocking_leads": 9
        },
        {
          "contacts": 2,
          "marketing_generated_leads": 57,
          "door_knocking_leads": 28
        },
        {
          "contacts": 3,
          "marketing_generated_leads": 29,
          "door_knocking_leads": 15
        },
        {
          "contacts": 4,
          "marketing_generated_leads": 21,
          "door_knocking_leads": 8
        },
        {
          "contacts": 3,
          "marketing_generated_leads": 22,
          "door_knocking_leads": 12
        },
        {
          "contacts": 4,
          "marketing_generated_leads": 17,
          "door_knocking_leads": 12
        },
        {
          "contacts": 6,
          "marketing_generated_leads": 17,
          "door_knocking_leads": 11
        },
        {
          "contacts": 5,
          "marketing_generated_leads": 13,
          "door_knocking_leads": 10
        },
        {
          "contacts": 7,
          "marketing_generated_leads": 18,
          "door_knocking_leads": 10
        },
        {
          "contacts": 6,
          "marketing_generated_leads": 18,
          "door_knocking_leads": 0
        }
      ],
      "2": [
        { "contacts": 2, "marketing_generated_leads": 15, "door_knocking_leads": 4, "inspections_completed": 26, "presentations": 3, "contracts": 6, "sold_revenue": 67849, "built_revenue": 182488, "google_reviews_5_star": 3 },
        { "contacts": 3, "marketing_generated_leads": 15, "door_knocking_leads": 3, "inspections_completed": 26, "presentations": 5, "contracts": 7, "sold_revenue": 97314, "built_revenue": 94701, "google_reviews_5_star": 4 },
        { "contacts": 2, "marketing_generated_leads": 12, "door_knocking_leads": 11, "inspections_completed": 17, "presentations": 4, "contracts": 5, "sold_revenue": 18443, "built_revenue": 229328, "google_reviews_5_star": 3 },
        { "contacts": 1, "marketing_generated_leads": 5, "door_knocking_leads": 18, "inspections_completed": 13, "presentations": 1, "contracts": 3, "sold_revenue": 48773, "built_revenue": 119392, "google_reviews_5_star": 3 },
        {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      "3": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      "4": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    },
    "Shreveport": {
      "1": [
        {
          "contacts": 0,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 0,
          "inspections_completed": 2,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 21899,
          "ar_over_90": 0,
          "google_reviews_5_star": 1
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 1,
          "door_knocking_leads": 3,
          "inspections_completed": 4,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 17602,
          "built_revenue": 18252,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 7,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 0,
          "inspections_completed": 1,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 2800,
          "built_revenue": 0,
          "ar_over_90": 5601,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 4,
          "marketing_generated_leads": 2,
          "door_knocking_leads": 0,
          "inspections_completed": 4,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 11623,
          "built_revenue": 500,
          "ar_over_90": 9492,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 0,
          "inspections_completed": 1,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 500,
          "built_revenue": 0,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 2,
          "inspections_completed": 11,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 770,
          "built_revenue": 11923,
          "ar_over_90": 0,
          "google_reviews_5_star": 4
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 5,
          "door_knocking_leads": 5,
          "inspections_completed": 8,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 28637,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 2,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 20,
          "inspections_completed": 10,
          "presentations": 0,
          "contracts": 4,
          "sold_revenue": 8800,
          "built_revenue": 2800,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 4,
          "door_knocking_leads": 8,
          "inspections_completed": 11,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 700,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 5,
          "inspections_completed": 8,
          "presentations": 0,
          "contracts": 3,
          "sold_revenue": 14610,
          "built_revenue": 4500,
          "ar_over_90": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 8,
          "door_knocking_leads": 9,
          "inspections_completed": 10,
          "presentations": 0,
          "contracts": 3,
          "sold_revenue": 88979,
          "built_revenue": 0,
          "ar_over_90": 0,
          "google_reviews_5_star": 1
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 8,
          "door_knocking_leads": 13,
          "inspections_completed": 19,
          "presentations": 0,
          "contracts": 2,
          "sold_revenue": 7000,
          "built_revenue": 8581,
          "ar_over_90": 0,
          "google_reviews_5_star": 6
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 11,
          "door_knocking_leads": 12,
          "inspections_completed": 17,
          "presentations": 0,
          "contracts": 3,
          "sold_revenue": 46123,
          "built_revenue": 11032,
          "ar_over_90": 0,
          "google_reviews_5_star": 2
        }
      ],
      "2": [
        { "contacts": 0, "marketing_generated_leads": 4, "door_knocking_leads": 3, "inspections_completed": 10, "presentations": 0, "contracts": 6, "sold_revenue": 44843, "built_revenue": 21558, "ar_over_90": 0, "google_reviews_5_star": 7 },
        { "contacts": 4, "marketing_generated_leads": 6, "door_knocking_leads": 12, "inspections_completed": 13, "presentations": 6, "contracts": 3, "sold_revenue": 32661, "built_revenue": 2500, "ar_over_90": 0, "google_reviews_5_star": 2 },
        { "contacts": 3, "marketing_generated_leads": 8, "door_knocking_leads": 5, "inspections_completed": 13, "presentations": 8, "contracts": 6, "sold_revenue": 56699, "built_revenue": 34088, "ar_over_90": 0, "google_reviews_5_star": 0 },
        { "contacts": 3, "marketing_generated_leads": 4, "door_knocking_leads": 1, "inspections_completed": 3, "presentations": 0, "contracts": 0, "sold_revenue": 0, "built_revenue": 47144, "ar_over_90": 0, "google_reviews_5_star": 0 },
        {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      "3": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      "4": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    },
    "Arkansas": {
      "1": [
        {
          "contacts": 1,
          "marketing_generated_leads": 0,
          "door_knocking_leads": 6,
          "inspections_completed": 5,
          "presentations": 0,
          "contracts": 3,
          "sold_revenue": 43644.93,
          "built_revenue": 34790,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 1,
          "door_knocking_leads": 12,
          "inspections_completed": 14,
          "presentations": 0,
          "contracts": 3,
          "sold_revenue": 70546,
          "built_revenue": 19595,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 1,
          "door_knocking_leads": 10,
          "inspections_completed": 7,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 29773,
          "built_revenue": 21850,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 0,
          "marketing_generated_leads": 1,
          "door_knocking_leads": 9,
          "inspections_completed": 6,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 17893,
          "built_revenue": 29338,
          "google_reviews_5_star": 1
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 2,
          "door_knocking_leads": 1,
          "inspections_completed": 2,
          "presentations": 0,
          "contracts": 2,
          "sold_revenue": 29338,
          "built_revenue": 0,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 14,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 5,
          "inspections_completed": 6,
          "presentations": 0,
          "contracts": 3,
          "sold_revenue": 28718,
          "built_revenue": 28390,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 2,
          "marketing_generated_leads": 9,
          "door_knocking_leads": 14,
          "inspections_completed": 14,
          "presentations": 0,
          "contracts": 2,
          "sold_revenue": 28717,
          "built_revenue": 112816,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 6,
          "marketing_generated_leads": 12,
          "door_knocking_leads": 8,
          "inspections_completed": 8,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 17500,
          "built_revenue": 57063,
          "google_reviews_5_star": 2
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 6,
          "door_knocking_leads": 5,
          "inspections_completed": 14,
          "presentations": 0,
          "contracts": 0,
          "sold_revenue": 0,
          "built_revenue": 68449,
          "google_reviews_5_star": 0
        },
        {
          "contacts": 2,
          "marketing_generated_leads": 10,
          "door_knocking_leads": 4,
          "inspections_completed": 14,
          "presentations": 0,
          "contracts": 3,
          "sold_revenue": 32777,
          "built_revenue": 0,
          "google_reviews_5_star": 2
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 9,
          "door_knocking_leads": 8,
          "inspections_completed": 9,
          "presentations": 0,
          "contracts": 1,
          "sold_revenue": 14676,
          "built_revenue": 15827,
          "google_reviews_5_star": 1
        },
        {
          "contacts": 1,
          "marketing_generated_leads": 9,
          "door_knocking_leads": 7,
          "inspections_completed": 15,
          "presentations": 0,
          "contracts": 2,
          "sold_revenue": 2225,
          "built_revenue": 32776,
          "google_reviews_5_star": 5
        },
        {
          "contacts": 3,
          "marketing_generated_leads": 12,
          "door_knocking_leads": 7,
          "inspections_completed": 14,
          "presentations": 0,
          "contracts": 4,
          "sold_revenue": 39828,
          "built_revenue": 2225,
          "google_reviews_5_star": 2
        }
      ],
      "2": [
        { "contacts": 5, "marketing_generated_leads": 8, "door_knocking_leads": 5, "inspections_completed": 19, "presentations": 0, "contracts": 4, "sold_revenue": 47549, "built_revenue": 16500, "google_reviews_5_star": 7 },
        { "contacts": 2, "marketing_generated_leads": 11, "door_knocking_leads": 2, "inspections_completed": 10, "presentations": 0, "contracts": 4, "sold_revenue": 26480, "built_revenue": 50149, "google_reviews_5_star": 1 },
        { "contacts": 1, "marketing_generated_leads": 5, "door_knocking_leads": 7, "inspections_completed": 13, "presentations": 0, "contracts": 2, "sold_revenue": 32861, "built_revenue": 13458, "google_reviews_5_star": 1 },
        { "contacts": 6, "marketing_generated_leads": 6, "door_knocking_leads": 5, "inspections_completed": 11, "presentations": 0, "contracts": 1, "sold_revenue": 8713, "built_revenue": 8713, "google_reviews_5_star": 2 },
        {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      "3": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      "4": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    },
    "Kansas": {
      "1": [
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 6, "inspections_completed": 2, "presentations": 0, "contracts": 0, "sold_revenue": 0, "built_revenue": 0, "google_reviews_5_star": 0 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 8, "inspections_completed": 6, "presentations": 0, "contracts": 0, "sold_revenue": 0, "built_revenue": 47052, "google_reviews_5_star": 0 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 19, "inspections_completed": 16, "presentations": 0, "contracts": 4, "sold_revenue": 46172, "built_revenue": 12140, "google_reviews_5_star": 0 },
        { "contacts": 2, "marketing_generated_leads": 0, "door_knocking_leads": 10, "inspections_completed": 6, "presentations": 0, "contracts": 2, "sold_revenue": 12140, "built_revenue": 0, "google_reviews_5_star": 1 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 0, "inspections_completed": 2, "presentations": 0, "contracts": 0, "sold_revenue": 0, "built_revenue": 0, "google_reviews_5_star": 0 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 12, "inspections_completed": 2, "presentations": 0, "contracts": 2, "sold_revenue": 26990, "built_revenue": 0, "google_reviews_5_star": 1 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 14, "inspections_completed": 14, "presentations": 0, "contracts": 1, "sold_revenue": 13912, "built_revenue": 0, "google_reviews_5_star": 1 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 13, "inspections_completed": 8, "presentations": 0, "contracts": 6, "sold_revenue": 75440, "built_revenue": 47886, "google_reviews_5_star": 0 },
        { "contacts": 3, "marketing_generated_leads": 0, "door_knocking_leads": 10, "inspections_completed": 9, "presentations": 0, "contracts": 5, "sold_revenue": 57064, "built_revenue": 13426, "google_reviews_5_star": 1 },
        { "contacts": 1, "marketing_generated_leads": 1, "door_knocking_leads": 6, "inspections_completed": 5, "presentations": 1, "contracts": 1, "sold_revenue": 23797, "built_revenue": 37385, "google_reviews_5_star": 1 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 5, "inspections_completed": 5, "presentations": 0, "contracts": 0, "sold_revenue": 0, "built_revenue": 28136, "google_reviews_5_star": 3 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 5, "inspections_completed": 3, "presentations": 3, "contracts": 3, "sold_revenue": 51534, "built_revenue": 38608, "google_reviews_5_star": 2 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 3, "inspections_completed": 2, "presentations": 2, "contracts": 2, "sold_revenue": 56938, "built_revenue": 46141, "google_reviews_5_star": 0 }
      ],
      "2": [
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 1, "inspections_completed": 1, "presentations": 2, "contracts": 2, "sold_revenue": 27445, "built_revenue": 84996, "google_reviews_5_star": 1 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 11, "inspections_completed": 5, "presentations": 1, "contracts": 1, "sold_revenue": 8844, "built_revenue": 21034, "google_reviews_5_star": 2 },
        { "contacts": 0, "marketing_generated_leads": 1, "door_knocking_leads": 12, "inspections_completed": 4, "presentations": 4, "contracts": 4, "sold_revenue": 60197, "built_revenue": 0, "google_reviews_5_star": 2 },
        { "contacts": 0, "marketing_generated_leads": 0, "door_knocking_leads": 15, "inspections_completed": 19, "presentations": 1, "contracts": 2, "sold_revenue": 30525, "built_revenue": 10313, "google_reviews_5_star": 1 },
        {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      "3": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      "4": [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    }
  }
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

export const SCORECARD_DEMO_STANDARDS: ScorecardStandards = {
  2026: {
    "Baton Rouge": {
      "contacts": { "annualStandard": 52.0, "q1Standard": 13.0, "q2Standard": 13.0, "q3Standard": 13.0, "q4Standard": 13.0, "allowCarryForwardShortfall": true },
      "marketing_generated_leads": { "annualStandard": 37.5, "q1Standard": 9.3750000006, "q2Standard": 9.3750000006, "q3Standard": 0.0, "q4Standard": 7.3125, "allowCarryForwardShortfall": true },
      "door_knocking_leads": { "annualStandard": 212.5, "q1Standard": 53.125000006, "q2Standard": 67.52900000599999, "q3Standard": 87.479166671, "q4Standard": 41.4375, "allowCarryForwardShortfall": true },
      "inspections_completed": { "annualStandard": 200.0, "q1Standard": 49.999999998, "q2Standard": 65.86000000000001, "q3Standard": 0.0, "q4Standard": 0.0, "allowCarryForwardShortfall": true },
      "presentations": { "annualStandard": 200.0, "q1Standard": 49.999999998, "q2Standard": 49.999999998, "q3Standard": 0.0, "q4Standard": 0.0, "allowCarryForwardShortfall": true },
      "contracts": { "annualStandard": 40.0, "q1Standard": 10.0, "q2Standard": 13.65, "q3Standard": 10.0, "q4Standard": 10.0, "allowCarryForwardShortfall": true },
      "sold_revenue": { "annualStandard": 1000000.0, "q1Standard": 249999.99999, "q2Standard": 273659.99999, "q3Standard": 249999.99999, "q4Standard": 249999.99999, "allowCarryForwardShortfall": true },
      "built_revenue": { "annualStandard": 800000.0, "q1Standard": 199999.99994, "q2Standard": 237752.00003, "q3Standard": 0.0, "q4Standard": 0.0, "allowCarryForwardShortfall": true },
      "backlog": { "annualStandard": 83333.33333, "q1Standard": 83333.33333, "q2Standard": 83333.33333, "q3Standard": 83333.33333, "q4Standard": 83333.33333, "allowCarryForwardShortfall": true },
      "ar_over_90": { "annualStandard": 30000.0, "q1Standard": 30000.0, "q2Standard": 30000.0, "q3Standard": 30000.0, "q4Standard": 30000.0, "allowCarryForwardShortfall": true },
      "google_reviews_5_star": { "annualStandard": 20.0, "q1Standard": 13.0, "q2Standard": 13.0, "q3Standard": 5.0, "q4Standard": 5.0, "allowCarryForwardShortfall": true }
    },
    "Monroe": {
      "contacts": { "annualStandard": 52.0, "q1Standard": 13.0, "q2Standard": 13.0, "q3Standard": 13.0, "q4Standard": 13.0, "allowCarryForwardShortfall": true },
      "marketing_generated_leads": { "annualStandard": 170.4545455, "q1Standard": 42.613636364, "q2Standard": 49.858, "q3Standard": 416.0, "q4Standard": 33.238636366, "allowCarryForwardShortfall": true },
      "door_knocking_leads": { "annualStandard": 965.9090909, "q1Standard": 241.57699999, "q2Standard": 280.47699999, "q3Standard": 241.57699999, "q4Standard": 241.57699999, "allowCarryForwardShortfall": true },
      "inspections_completed": { "annualStandard": 424.2424242, "q1Standard": 106.06060604, "q2Standard": 106.06060604, "q3Standard": 0.0, "q4Standard": 0.0, "allowCarryForwardShortfall": true },
      "presentations": { "annualStandard": 1061.0, "q1Standard": 265.24999995, "q2Standard": 344.812, "q3Standard": 0.0, "q4Standard": 0.0, "allowCarryForwardShortfall": true },
      "contracts": { "annualStandard": 212.1212121, "q1Standard": 53.030303027, "q2Standard": 62.520303027, "q3Standard": 53.030303027, "q4Standard": 53.030303027, "allowCarryForwardShortfall": true },
      "sold_revenue": { "annualStandard": 3500000.0, "q1Standard": 875000.00003, "q2Standard": 1078766.0, "q3Standard": 875000.00003, "q4Standard": 875000.00003, "allowCarryForwardShortfall": true },
      "built_revenue": { "annualStandard": 2800000.0, "q1Standard": 700000.00005, "q2Standard": 811707.0, "q3Standard": 0.0, "q4Standard": 0.0, "allowCarryForwardShortfall": true },
      "google_reviews_5_star": { "annualStandard": 106.0606061, "q1Standard": 26.51515152, "q2Standard": 26.51515152, "q3Standard": 26.0, "q4Standard": 26.0, "allowCarryForwardShortfall": true }
    },
    "Shreveport": {
      "contacts": {
        "annualStandard": 52.0,
        "q1Standard": 9.5766666671,
        "q2Standard": 15.209999999999999,
        "q3Standard": 21.406666671,
        "q4Standard": 10.14,
        "allowCarryForwardShortfall": true
      },
      "marketing_generated_leads": {
        "annualStandard": 148.125,
        "q1Standard": 27.2796875,
        "q2Standard": 37.031249996,
        "q3Standard": 60.978125,
        "q4Standard": 28.884375,
        "allowCarryForwardShortfall": true
      },
      "door_knocking_leads": {
        "annualStandard": 839.375,
        "q1Standard": 154.58489579,
        "q2Standard": 299.0,
        "q3Standard": 345.54270829,
        "q4Standard": 163.678125,
        "allowCarryForwardShortfall": true
      },
      "inspections_completed": {
        "annualStandard": 790.0,
        "q1Standard": 145.49166671,
        "q2Standard": 269.09999999999997,
        "q3Standard": 325.21666670999997,
        "q4Standard": 154.04999999999998,
        "allowCarryForwardShortfall": true
      },
      "presentations": {
        "annualStandard": 790.0,
        "q1Standard": 145.49166671,
        "q2Standard": 269.09999999999997,
        "q3Standard": 325.21666670999997,
        "q4Standard": 154.04999999999998,
        "allowCarryForwardShortfall": true
      },
      "contracts": {
        "annualStandard": 157.8947368,
        "q1Standard": 29.078947365,
        "q2Standard": 45.440684211,
        "q3Standard": 65.0,
        "q4Standard": 30.789473689,
        "allowCarryForwardShortfall": true
      },
      "sold_revenue": {
        "annualStandard": 3000000.0,
        "q1Standard": 552500.0,
        "q2Standard": 956959.99997,
        "q3Standard": 1235000.0,
        "q4Standard": 585000.0,
        "allowCarryForwardShortfall": true
      },
      "built_revenue": {
        "annualStandard": 2400000.0,
        "q1Standard": 442000.0,
        "q2Standard": 796559.99995,
        "q3Standard": 988000.0,
        "q4Standard": 468000.0,
        "allowCarryForwardShortfall": true
      },
      "ar_over_90": {
        "annualStandard": 30000.0,
        "q1Standard": 30000.0,
        "q2Standard": 30000.0,
        "q3Standard": 30000.0,
        "q4Standard": 30000.0,
        "allowCarryForwardShortfall": true
      },
      "google_reviews_5_star": {
        "annualStandard": 78.94736842,
        "q1Standard": 14.539473689000001,
        "q2Standard": 23.092105257,
        "q3Standard": 32.5,
        "q4Standard": 15.394736838,
        "allowCarryForwardShortfall": true
      }
    },
    "Arkansas": {
      "contacts": { "annualStandard": 52.0, "q1Standard": 13.0, "q2Standard": 13.0, "q3Standard": 13.0, "q4Standard": 13.0, "allowCarryForwardShortfall": true },
      "marketing_generated_leads": { "annualStandard": 198.8636364, "q1Standard": 36.624053024, "q2Standard": 49.715909087, "q3Standard": 416.0, "q4Standard": 38.778409085, "allowCarryForwardShortfall": true },
      "door_knocking_leads": { "annualStandard": 1126.893939, "q1Standard": 281.72348489999996, "q2Standard": 385.72348489999996, "q3Standard": 281.72348489999996, "q4Standard": 281.72348489999996, "allowCarryForwardShortfall": true },
      "inspections_completed": { "annualStandard": 1060.606061, "q1Standard": 265.1515152, "q2Standard": 347.09999999999997, "q3Standard": 265.1515152, "q4Standard": 265.1515152, "allowCarryForwardShortfall": true },
      "presentations": { "annualStandard": 1061.0, "q1Standard": 265.24999995, "q2Standard": 344.812, "q3Standard": 0, "q4Standard": 0, "allowCarryForwardShortfall": true },
      "contracts": { "annualStandard": 212.1212121, "q1Standard": 53.030303027, "q2Standard": 62.520303027, "q3Standard": 53.030303027, "q4Standard": 53.030303027, "allowCarryForwardShortfall": true },
      "sold_revenue": { "annualStandard": 3500000.0, "q1Standard": 875000.00003, "q2Standard": 1078766.0, "q3Standard": 875000.00003, "q4Standard": 875000.00003, "allowCarryForwardShortfall": true },
      "built_revenue": { "annualStandard": 2800000.0, "q1Standard": 700000.00005, "q2Standard": 811707.0, "q3Standard": 0, "q4Standard": 0, "allowCarryForwardShortfall": true },
      "google_reviews_5_star": { "annualStandard": 106.0606061, "q1Standard": 26.51515152, "q2Standard": 26.51515152, "q3Standard": 26.0, "q4Standard": 26.0, "allowCarryForwardShortfall": true }
    },
    "Kansas": {
      "contacts": { "annualStandard": 52.0, "q1Standard": 13.0, "q2Standard": 13.0, "q3Standard": 13.0, "q4Standard": 13.0, "allowCarryForwardShortfall": true },
      "marketing_generated_leads": { "annualStandard": 0, "q1Standard": 0.0, "q2Standard": 0.0, "q3Standard": 0.0, "q4Standard": 0.0, "allowCarryForwardShortfall": true },
      "door_knocking_leads": { "annualStandard": 625.0, "q1Standard": 156.25000001, "q2Standard": 182.0, "q3Standard": 156.25, "q4Standard": 156.25, "allowCarryForwardShortfall": true },
      "inspections_completed": { "annualStandard": 500.0, "q1Standard": 124.999999995, "q2Standard": 156.0, "q3Standard": 125.0, "q4Standard": 125.0, "allowCarryForwardShortfall": true },
      "presentations": { "annualStandard": 500.0, "q1Standard": 124.999999995, "q2Standard": 156.0, "q3Standard": 125.0, "q4Standard": 125.0, "allowCarryForwardShortfall": true },
      "contracts": { "annualStandard": 100.0, "q1Standard": 24.999999999, "q2Standard": 25.0, "q3Standard": 25.0, "q4Standard": 25.0, "allowCarryForwardShortfall": true },
      "sold_revenue": { "annualStandard": 1500000.0, "q1Standard": 375000.00005, "q2Standard": 386386.0, "q3Standard": 375000.0, "q4Standard": 375000.0, "allowCarryForwardShortfall": true },
      "built_revenue": { "annualStandard": 1200000.0, "q1Standard": 300000.00004, "q2Standard": 300000.0, "q3Standard": 300000.0, "q4Standard": 300000.0, "allowCarryForwardShortfall": true },
      "google_reviews_5_star": { "annualStandard": 50.0, "q1Standard": 26.0, "q2Standard": 26.0, "q3Standard": 26.0, "q4Standard": 26.0, "allowCarryForwardShortfall": true }
    },
  },
};

