export interface ComparisonChartDatum {
  name: string;
  first: number;
  second: number;
}

export interface ComparisonChartProps {
  data: ComparisonChartDatum[];
  firstLabel?: string;
  secondLabel?: string;
}
