// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Info } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Avatar } from "./Avatar/Avatar";
import { Badge } from "./Badge/Badge";
import { Tooltip } from "./Tooltip/Tooltip";

describe("extra atoms", () => {
  it("renders badge, avatar fallback, and tooltip content", async () => {
    render(
      <div>
        <Badge status="completed" />
        <Avatar alt="Looply user" fallback="LU" />
        <Tooltip content="Helpful note">
          <button type="button">
            <Info />
          </button>
        </Tooltip>
      </div>,
    );

    expect(screen.getByText("Completed")).toBeTruthy();
    expect(screen.getByLabelText("Looply user")).toBeTruthy();

    await userEvent.hover(screen.getByRole("button"));
    expect(screen.getByRole("tooltip")).toBeTruthy();
    expect(screen.getByText("Helpful note")).toBeTruthy();
  });
});
