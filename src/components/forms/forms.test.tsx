// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Select } from "./Select/Select";
import { Tabs } from "./Tabs/Tabs";
import { TextInput } from "./TextInput/TextInput";

describe("forms", () => {
  it("renders text input with helper text", () => {
    render(<TextInput helperText="Helper" label="Email" />);
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.getByText("Helper")).toBeTruthy();
  });

  it("changes generic select values", async () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Status"
        options={[
          { label: "Draft", value: "draft" },
          { label: "Sent", value: "sent" },
        ]}
        value={"draft"}
        onChange={onChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Status"), "sent");
    expect(onChange).toHaveBeenCalledWith("sent");
  });

  it("switches tabs", async () => {
    const onValueChange = vi.fn();
    render(
      <Tabs
        ariaLabel="Sections"
        tabs={[
          { label: "First", value: "first" },
          { label: "Second", value: "second" },
        ]}
        value="first"
        onValueChange={onValueChange}
      />,
    );

    await userEvent.click(screen.getByRole("tab", { name: /Second/i }));
    expect(onValueChange).toHaveBeenCalledWith("second");
  });
});
