import { describe, it, expect } from "bun:test";
import { ChartView } from "../../src/components/ChartView";

describe("ChartView Component", () => {
  it("renders the basic chart container structure", async () => {
    const result = await ChartView();
    const stringResult = result.toString();

    // Check main container
    expect(stringResult).toContain(`class="chart-dashboard"`);
    expect(stringResult).toContain(`id="chart-container"`);

    // Check chart type buttons
    expect(stringResult).toContain(`data-style="bar"`);
    expect(stringResult).toContain(`data-style="rose"`);
    expect(stringResult).toContain(`data-style="bubble"`);
    expect(stringResult).toContain(`data-style="treemap"`);

    // Check metric select
    expect(stringResult).toContain(`onchange="switchMetric(this.value)"`);
    expect(stringResult).toContain(`value="gdpPerCapita"`);
    expect(stringResult).toContain(`value="population"`);
    expect(stringResult).toContain(`value="area"`);

    // Check embedded JS
    expect(stringResult).toContain(`let echartsInstance = null;`);
    expect(stringResult).toContain(`function loadChart()`);
    expect(stringResult).toContain(`function getChartOption()`);
  });
});
