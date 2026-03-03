import { describe, it, expect } from "bun:test";
import { Header } from "../../src/components/Header";

describe("Header Component", () => {
  it("renders with title only", async () => {
    const title = "My Dashboard";
    const result = await Header({ title });
    const stringResult = result.toString();

    expect(stringResult).toContain(`<header>`);
    expect(stringResult).toContain(`<h1>${title}</h1>`);
    expect(stringResult).not.toContain(`class="meta"`);
  });

  it("renders with title and subtitle", async () => {
    const title = "My Dashboard";
    const subtitle = "Welcome back, user";
    const result = await Header({ title, subtitle });
    const stringResult = result.toString();

    expect(stringResult).toContain(`<h1>${title}</h1>`);
    expect(stringResult).toContain(`<div class="meta">${subtitle}</div>`);
  });
});
