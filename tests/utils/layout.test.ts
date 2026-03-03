import { describe, it, expect } from "bun:test";
import { html, raw } from "hono/html";
import { Layout } from "../../src/utils/layout";

describe("Layout Utility Component", () => {
  it("renders with a given title", async () => {
    const title = "My Test Title";
    const result = await Layout({ title, children: html`<div id='test-child'></div>` });
    const stringResult = result.toString();
    expect(stringResult).toContain(`<title>${title} | EZ World Info - Global Metrics & Analysis</title>`);
    expect(stringResult).toContain(`content="${title} | EZ World Info"`);
  });

  it("renders the children properly", async () => {
    const childrenStr = "<div id='my-unique-child'>Child Content</div>";
    const result = await Layout({ title: "Test", children: raw(childrenStr) });
    const stringResult = result.toString();
    expect(stringResult).toContain(childrenStr);
  });

  it("includes all essential script and style tags", async () => {
    const result = await Layout({ title: "Test", children: "" });
    const stringResult = result.toString();

    // Check for stylesheet
    expect(stringResult).toContain('<link rel="stylesheet" href="/styles.css" />');

    // Check for eCharts
    expect(stringResult).toContain('echarts.min.js');

    // Check for alpinejs
    expect(stringResult).toContain('alpinejs@3');

    // Check for htmx
    expect(stringResult).toContain('htmx.org');

    // Check for schema
    expect(stringResult).toContain('type="application/ld+json"');
  });
});
