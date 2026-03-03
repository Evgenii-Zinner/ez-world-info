import { describe, it, expect } from "bun:test";
import { Footer } from "../../src/components/Footer";

describe("Footer Component", () => {
  it("renders the footer structure with current year", async () => {
    const result = await Footer();
    const stringResult = result.toString();
    const currentYear = new Date().getFullYear().toString();

    expect(stringResult).toContain(`<footer class="footer">`);
    expect(stringResult).toContain(`&copy; ${currentYear}`);
    expect(stringResult).toContain(`Evgenii Zinner`);
    expect(stringResult).toContain(`https://restcountries.com`);
    expect(stringResult).toContain(`https://data.worldbank.org`);
    expect(stringResult).toContain(`https://www.exchangerate-api.com`);
  });
});
