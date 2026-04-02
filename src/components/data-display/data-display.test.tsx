// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChartCard } from "@/components/charts";

import { DataTable } from "./DataTable/DataTable";
import { KpiCard } from "./KpiCard/KpiCard";

describe("data display", () => {
  it("renders a kpi card", () => {
    render(<KpiCard label="Revenue" trend="up" trendPercentage={12.4} value={1200} />);
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.getByText("1,200")).toBeTruthy();
  });

  it("sorts a table through the header button", async () => {
    const onSort = vi.fn();
    render(
      <DataTable
        caption="Rows"
        columns={[{ key: "name", header: "Name", sortable: true }]}
        data={[{ id: "1", name: "Alice" }]}
        getRowId={(row) => row.id}
        onSort={onSort}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(onSort).toHaveBeenCalledWith({ key: "name", direction: "asc" });
  });

  it("renders a chart wrapper", () => {
    render(
      <ChartCard title="Chart" description="Description">
        <div>Chart body</div>
      </ChartCard>,
    );

    expect(screen.getByText("Chart")).toBeTruthy();
    expect(screen.getByText("Chart body")).toBeTruthy();
  });
});
