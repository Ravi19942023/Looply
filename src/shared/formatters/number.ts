export type NumberFormatType = "currency" | "percentage" | "decimal" | "number";

export function formatValue(
  value: string | number | null,
  formatType: NumberFormatType = "number",
  locale = "en-US",
): string {
  if (value == null) return "---";
  if (typeof value === "string") return value;

  const style = formatType === "currency" ? "currency" : "decimal";
  const options: Intl.NumberFormatOptions = {
    style,
    currency: "USD",
    maximumFractionDigits: 2,
  };

  if (formatType === "percentage") {
    // If value is 0.05, it should show 5.0%
    return new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / 100); // Usually stored as whole numbers in KPI cards (e.g. 5 for 5%)
  }

  // Handle simple percentage if already fractional
  if (formatType === "decimal" || formatType === "number" || formatType === "currency") {
    return new Intl.NumberFormat(locale, options).format(value);
  }

  return String(value);
}
