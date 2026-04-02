export interface ChartDatum {
  name: string;
  value: number;
}

export interface BarChartProps {
  data: ChartDatum[];
}
