import { describe, it, expect } from "bun:test";
import { Navbar } from "../../src/components/Navbar";

describe("Navbar Component", () => {
  it("renders the navbar structure", async () => {
    const result = await Navbar();
    const stringResult = result.toString();

    expect(stringResult).toContain(`<nav class="navbar">`);
    expect(stringResult).toContain(`EZ World Info`);
    expect(stringResult).toContain(`href="/?tab=table"`);
    expect(stringResult).toContain(`href="/chart"`);
    expect(stringResult).toContain(`onclick="toggleTheme()"`);
    expect(stringResult).toContain(`updateActiveTab`);
  });
});
