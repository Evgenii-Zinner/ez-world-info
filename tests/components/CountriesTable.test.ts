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
    expect(stringResult).toContain(`class="table-header-controls"`);
    expect(stringResult).toContain(`placeholder="Search..."`);
  });

  it("sanitizes JSON properly to prevent XSS breakout", async () => {
    const rows = [
      {
        code: "XSS",
        name: "</script><script>alert('XSS')</script>",
        gdpPerCapita: 100
      },
      {
        code: "LS",
        name: "\u2028\u2029",
        gdpPerCapita: 200
      },
      {
        code: "TAG",
        name: "<!--",
        gdpPerCapita: 300
      }
    ];

    const result = await renderTable({ rows: rows as any });
    const stringResult = result.toString();

    // Should have properly replaced < with \u003c
    expect(stringResult).toContain(`\\u003c/script\\u003e\\u003cscript\\u003ealert('XSS')\\u003c/script\\u003e`);

    // Should have replaced > with \u003e
    expect(stringResult).toContain(`\\u003e`);

    // Should have replaced line separators
    expect(stringResult).toContain(`\\u2028\\u2029`);

    // Check that it's inside an application/json script tag
    expect(stringResult).toContain('type="application/json"');

    // Should not contain a raw closing script tag inside any script block
    const parts = stringResult.split('</script>');
    // Expect exactly 2 </script> tags: one for component logic, one for JSON island.
    expect(parts.length).toBe(3);

    // Verify it doesn't contain raw < or > in the JSON island
    const jsonIslandMatch = stringResult.match(/<script [^>]*type="application\/json"[^>]*>(.*?)<\/script>/s);
    if (jsonIslandMatch) {
        const content = jsonIslandMatch[1];
        expect(content).not.toContain('<');
        expect(content).not.toContain('>');
    } else {
        throw new Error("JSON island not found in output");
    }
  });
});
