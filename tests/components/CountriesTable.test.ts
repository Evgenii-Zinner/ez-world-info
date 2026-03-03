import { describe, it, expect } from "bun:test";
import { renderTable } from "../../src/components/CountriesTable";

describe("CountriesTable Component", () => {
  it("renders the table shell correctly", async () => {
    const rows = [];
    const result = await renderTable({ rows });
    const stringResult = result.toString();

    // Check table structure
    expect(stringResult).toContain(`<table`);
    expect(stringResult).toContain(`</thead>`);
    expect(stringResult).toContain(`<tbody>`);

    // Check toolbar elements
    expect(stringResult).toContain(`class="toolbar"`);
    expect(stringResult).toContain(`placeholder="Search countries..."`);
  });

  it("sanitizes JSON properly to prevent XSS breakout", async () => {
    const rows = [
      {
        code: "XSS",
        name: "</script><script>alert('XSS')</script>",
        gdpPerCapita: 100
      }
    ];

    const result = await renderTable({ rows: rows as any });
    const stringResult = result.toString();

    // Should have properly replaced the closing script tag
    expect(stringResult).toContain(`<\\/script>`);
    // Should not contain a raw closing script tag inside the JSON data block
    const jsonBlockMatch = stringResult.match(/<script type="application\/json" id="table-data">(.*?)<\/script>/s);
    if (jsonBlockMatch) {
        expect(jsonBlockMatch[1]).not.toContain('</script>');
    }
  });
});
