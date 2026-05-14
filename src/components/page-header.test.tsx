import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<PageHeader title="Title" description="Test Description" />);
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <PageHeader 
        title="Title" 
        actions={<button data-testid="test-action">Action</button>} 
      />
    );
    expect(screen.getByTestId("test-action")).toBeInTheDocument();
  });
});
