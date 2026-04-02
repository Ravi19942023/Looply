"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LineChartProps } from "./LineChart.types";

export function LineChart({ data }: LineChartProps) {
  return (
    <ResponsiveContainer height={280} width="100%">
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line dataKey="value" dot={false} stroke="var(--color-accent)" strokeWidth={2} type="monotone" />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
