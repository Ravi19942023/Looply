export interface DateRangeValue {
  startDate: string;
  endDate: string;
  preset?: "custom" | "7d" | "30d" | "90d";
}

export interface DateRangePickerProps {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  ariaLabel?: string;
  onValueChange?: (value: DateRangeValue) => void;
}
