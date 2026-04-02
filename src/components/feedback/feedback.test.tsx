// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/atoms";

import { ConfirmationDialog } from "./ConfirmationDialog/ConfirmationDialog";
import { ToastProvider, useToast } from "./ToastProvider/ToastProvider";

function ToastConsumer() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() =>
        toast({
          title: "Saved",
          description: "Done",
          variant: "success",
        })
      }
    >
      Trigger toast
    </Button>
  );
}

describe("feedback", () => {
  it("renders and confirms the confirmation dialog", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationDialog
        description="Confirm the action"
        isOpen
        title="Confirm"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows toast content through the provider", async () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Trigger toast" }));
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
  });
});
