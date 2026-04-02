// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Drawer } from "./Drawer/Drawer";
import { Modal } from "./Modal/Modal";

describe("layout", () => {
  it("renders modal content when open", () => {
    render(
      <Modal isOpen title="Modal title" onClose={() => undefined}>
        <div>Modal body</div>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Modal body")).toBeTruthy();
  });

  it("renders drawer and closes from the close button", async () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen title="Drawer title" onClose={onClose}>
        <div>Drawer body</div>
      </Drawer>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Close drawer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
