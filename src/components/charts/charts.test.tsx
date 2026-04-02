// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BarChart, ChartCard, ComparisonChart, DonutChart, LineChart } from ".";

const series = [
  { name: "Jan", value: 12 },
  { name: "Feb", value: 18 },
];

describe("charts", () => {
  it("renders chart wrappers without crashing", () => {
    render(
      <div>
        <ChartCard title="Bar">
          <BarChart data={series} />
        </ChartCard>
        <ChartCard title="Line">
          <LineChart data={series} />
        </ChartCard>
        <ChartCard title="Donut">
          <DonutChart data={series} />
        </ChartCard>
        <ChartCard title="Comparison">
          <ComparisonChart
            data={[
              { name: "Jan", first: 12, second: 18 },
              { name: "Feb", first: 20, second: 14 },
            ]}
          />
        </ChartCard>
      </div>,
    );

    expect(screen.getByText("Bar")).toBeTruthy();
    expect(screen.getByText("Comparison")).toBeTruthy();
  });
});
