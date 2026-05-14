import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders pending status by default", () => {
    render(<StatusBadge />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it("renders correct label for scheduled status", () => {
    render(<StatusBadge status="scheduled" />);
    expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
  });

  it("replaces underscores with spaces in label", () => {
    render(<StatusBadge status="out_for_delivery" />);
    expect(screen.getByText(/out for delivery/i)).toBeInTheDocument();
  });

  it("handles null status", () => {
    render(<StatusBadge status={null} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });
});
