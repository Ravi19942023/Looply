import dynamic from "next/dynamic";
import { Skeleton } from "@/components/feedback/Skeleton";

export { DateRangePicker } from "./DateRangePicker";
export type { DateRangePickerProps, DateRangeValue } from "./DateRangePicker.types";

export const DateRangePickerLazy = dynamic(
  () => import("./DateRangePicker").then((module) => module.DateRangePicker),
  {
    loading: () => <Skeleton height={40} width={220} />,
  },
);
