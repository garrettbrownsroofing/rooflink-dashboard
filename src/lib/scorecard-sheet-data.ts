// Sheet-driven manual scorecard data (spreadsheet-exact).
//
// Generated from:
// `/Users/maxwell/Downloads/2026 Residential Sales Manager L-10 .xlsx`
// Sheet: `Residential Scorecard`

import reportingDates from "@/lib/scorecard-reporting-dates-2026.json";
import sheet from "@/lib/scorecard-sheet-2026.json";

export type ScorecardLocation =
  | "Baton Rouge"
  | "Monroe"
  | "Shreveport"
  | "Arkansas"
  | "Kansas"
  | "Overall";

export type SheetMetric = {
  annualStandard: number | null;
  annualActual: number | null;
  ytdStandard: number | null;
  // Quarter keys are strings ("1".."4") because these are JSON-imported.
  quarterActual: Record<string, number | null>;
  quarterWeeklyStandard: Record<string, number | null>;
  // 13 entries per quarter.
  weeks: Record<string, Array<number | null>>;
};

export type ScorecardSheet = Record<string, Record<ScorecardLocation, Record<string, SheetMetric>>>;
export type ReportingDates = Record<string, Record<string, string[]>>;

export const SCORECARD_REPORTING_DATES = reportingDates as unknown as ReportingDates;
export const SCORECARD_SHEET = sheet as unknown as ScorecardSheet;

