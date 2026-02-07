import { html } from "hono/html";

type TabsProps = {
  activeTab: "table" | "chart";
};

export const Tabs = ({ activeTab }: TabsProps) => {
  return html`<nav class="tabs">
    <a
      class="tab ${activeTab === "table" ? "active" : ""}"
      href="/?tab=table"
    >
      <span class="tab-icon">📊</span>
      Data Table
    </a>
    <a
      class="tab ${activeTab === "chart" ? "active" : ""}"
      href="/?tab=chart"
    >
      <span class="tab-icon">📈</span>
      GDP Chart
    </a>
  </nav>`;
};
