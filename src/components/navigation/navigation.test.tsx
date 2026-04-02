// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/customers",
}));

import { SearchInput } from "@/components/forms";

import { Sidebar } from "./Sidebar/Sidebar";
import { TopBar } from "./TopBar/TopBar";

describe("navigation", () => {
  it("renders sidebar items and marks the active item", () => {
    render(
      <Sidebar
        brand="Workspace"
        items={[
          { href: "/", label: "Dashboard" },
          { href: "/customers", label: "Customers" },
        ]}
      />,
    );

    expect(screen.getByText("Workspace")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Customers/i })).toBeTruthy();
  });

  it("renders topbar title, subtitle, search, and user label", () => {
    render(
      <TopBar
        search={<SearchInput ariaLabel="Search" />}
        subtitle="Subtitle"
        title="Title"
        userLabel="Looply"
      />,
    );

    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Subtitle")).toBeTruthy();
    expect(screen.getByLabelText("Search")).toBeTruthy();
    expect(screen.getAllByText("Looply").length).toBeGreaterThan(0);
  });
});
