export type RepeatKind = "daily" | "weekdays" | "weekly" | "monthly" | "yearly";

export interface Repeat {
  kind: RepeatKind;
  interval: number;
}
