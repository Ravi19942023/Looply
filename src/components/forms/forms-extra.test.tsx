// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./Checkbox/Checkbox";
import { DateRangePicker } from "./DateRangePicker/DateRangePicker";
import { FileInput } from "./FileInput/FileInput";
import { Toggle } from "./Toggle/Toggle";

describe("extra form controls", () => {
  it("toggles checkbox and switch controls", async () => {
    const onCheckedChange = vi.fn();
    const onToggleChange = vi.fn();

    render(
      <div>
        <Checkbox checked={false} label="Accept" onCheckedChange={onCheckedChange} />
        <Toggle checked={false} label="Active" onCheckedChange={onToggleChange} />
      </div>,
    );

    await userEvent.click(screen.getByLabelText("Accept"));
    await userEvent.click(screen.getByLabelText("Active"));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(onToggleChange).toHaveBeenCalledWith(true);
  });

  it("changes date range values", async () => {
    const onValueChange = vi.fn();

    render(<DateRangePicker ariaLabel="Date range" onValueChange={onValueChange} />);

    await userEvent.click(screen.getByText("Date range"));
    await userEvent.selectOptions(screen.getByLabelText("Preset"), "30d");

    expect(onValueChange).toHaveBeenCalled();
  });

  it("reports file changes", async () => {
    const onFilesChange = vi.fn();

    render(<FileInput label="Upload" onFilesChange={onFilesChange} />);

    const input = screen.getByLabelText("Upload");
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    await userEvent.upload(input, file);
    expect(onFilesChange).toHaveBeenCalled();
  });
});
