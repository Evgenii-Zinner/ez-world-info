import { html } from "hono/html";

export const ChartView = () => {
  return html`
  <div class="chart-dashboard">
    <div class="chart-controls-panel">
      <div class="control-group">
        <label>Visual Style:</label>
        <div class="style-buttons">
          <button class="style-btn active" data-style="bar" onclick="switchChartStyle('bar')">📊 Bar</button>
          <button class="style-btn" data-style="rose" onclick="switchChartStyle('rose')">🌹 Rose</button>
          <button class="style-btn" data-style="bubble" onclick="switchChartStyle('bubble')">🫧 Bubble</button>
          <button class="style-btn" data-style="treemap" onclick="switchChartStyle('treemap')">🗺️ Map</button>
        </div>
      </div>

      <div class="control-group">
        <label>Metric:</label>
        <select id="metric-selector" class="metric-select" onchange="switchMetric(this.value)">
          <option value="gdpPerCapita">GDP per Capita</option>
          <option value="population">Population</option>
          <option value="area">Total Area</option>
          <option value="internetUsers">Internet Users %</option>
          <option value="gini">Gini Index</option>
        </select>
      </div>

      <div class="selection-notice" id="selection-status">
        Loading data...
      </div>
    </div>

    <div class="chart-main-area">
      <div class="chart-wrapper">
        <div id="chart-container"></div>
      </div>
    </div>
  </div>

  <script>
    let echartsInstance = null;
    let currentChartStyle = "bar";
    let currentMetric = "gdpPerCapita";
    let allRows = [];
    let currentTheme = document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';

    const metricLabels = {
      gdpPerCapita: "GDP per Capita",
      population: "Population",
      area: "Area (km²)",
      internetUsers: "Internet Users (%)",
      gini: "Gini Index"
    };

    // Theme-specific colors
    const themeColors = {
      dark: {
        text: '#ccc',
        textMuted: '#888',
        axisLine: 'rgba(0, 243, 255, 0.2)',
        splitLine: 'rgba(255, 255, 255, 0.05)',
        main: '#00f3ff',
        accent: '#bc13fe',
        bg: 'transparent',
        tooltipBg: 'rgba(0, 0, 0, 0.95)',
        palette: ["#00f3ff", "#bc13fe", "#00ff41", "#ff00ff", "#ffa500", "#007bff", "#ffc107"]
      },
      light: {
        text: '#1c1c1e',
        textMuted: '#8e8e93',
        axisLine: 'rgba(0, 85, 255, 0.2)',
        splitLine: 'rgba(0, 0, 0, 0.05)',
        main: '#0055ff',
        accent: '#7000ff',
        bg: 'transparent',
        tooltipBg: 'rgba(255, 255, 255, 0.95)',
        palette: ["#0055ff", "#7000ff", "#008b99", "#d91e18", "#f39c12", "#27ae60", "#2980b9"]
      }
    };

    // Initialize Theme Detection
    const observer = new MutationObserver(() => {
        const isLight = document.documentElement.classList.contains('theme-light');
        const newTheme = isLight ? 'light' : 'dark';
        if (newTheme !== currentTheme) {
            currentTheme = newTheme;
            renderChart();
        }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    async function loadChart() {
      let selectedStr = localStorage.getItem("selectedCountries");
      let selectedCodes = [];
      if (selectedStr) {
          try {
              selectedCodes = JSON.parse(selectedStr);
              if (typeof selectedCodes === 'object' && !Array.isArray(selectedCodes)) {
                  selectedCodes = selectedCodes.value || [];
              }
          } catch(e) { 
              selectedCodes = selectedStr.split(',').filter(x => x.length > 0);
          }
      }
      
      const queryParam = selectedCodes.length > 0 ? "?selected=" + selectedCodes.join(',') : "";
      const statusEl = document.getElementById("selection-status");
      
      if (selectedCodes.length > 0) {
          statusEl.innerText = "Comparing " + selectedCodes.length + " selected countries";
      } else {
          statusEl.innerText = "Showing Top 50 by GDP (No countries selected)";
      }
      
      try {
        const response = await fetch("/chart-data" + queryParam);
        allRows = await response.json();

        const container = document.getElementById("chart-container");
        if (!echartsInstance) {
          echartsInstance = echarts.init(container, null, { useDirtyRect: true });
          window.addEventListener("resize", () => echartsInstance && echartsInstance.resize());
        }

        renderChart();
      } catch (error) {
        console.error("Error loading chart:", error);
      }
    }

    function renderChart() {
      if (!echartsInstance || !allRows.length) return;
      const option = getChartOption();
      echartsInstance.setOption(option, true);
    }

    function getChartOption() {
      const metric = currentMetric;
      const style = currentChartStyle;
      const theme = themeColors[currentTheme];
      const validRows = allRows.filter(r => r[metric] !== null && r[metric] !== undefined);
      
      const labels = validRows.map(r => r.name);
      const values = validRows.map(r => r[metric]);

      const baseOption = {
        color: theme.palette,
        backgroundColor: theme.bg,
        textStyle: { fontFamily: "'Chakra Petch', sans-serif", color: theme.text },
        tooltip: {
          trigger: 'item',
          backgroundColor: theme.tooltipBg,
          borderColor: theme.main,
          borderWidth: 1,
          textStyle: { color: theme.text },
          formatter: (params) => {
            const data = params.data || params;
            const name = data.name || params.name;
            const val = data.value !== undefined ? data.value : params.value;
            return '<div style="font-family:Orbitron; color:' + theme.main + '; margin-bottom:4px">' + name + '</div>' +
                    metricLabels[metric] + ': <span style="color:' + (currentTheme === 'dark' ? '#fff' : '#000') + '">' + formatValue(val, metric) + '</span>';
          }
        },
        grid: { top: 60, bottom: 80, left: 100, right: 40 }
      };

      if (style === "bar") {
        return {
          ...baseOption,
          tooltip: { ...baseOption.tooltip, trigger: 'axis' },
          xAxis: {
            type: "category",
            data: labels,
            axisLabel: { interval: 0, rotate: 45, color: theme.text, fontSize: 10 },
            axisLine: { lineStyle: { color: theme.axisLine } }
          },
          yAxis: {
            type: "value",
            name: metricLabels[metric],
            axisLabel: { color: theme.main, formatter: (val) => formatCompact(val, metric) },
            axisLine: { lineStyle: { color: theme.axisLine } },
            splitLine: { lineStyle: { color: theme.splitLine } }
          },
          series: [{
            data: values,
            type: "bar",
            barWidth: '60%',
            itemStyle: {
              color: theme.main, 
              borderColor: theme.accent,
              borderWidth: 1,
              shadowBlur: currentTheme === 'dark' ? 5 : 0,
              shadowColor: theme.main
            },
            emphasis: {
              itemStyle: {
                color: currentTheme === 'dark' ? '#fff' : theme.accent,
                shadowBlur: 15,
                shadowColor: theme.main
              }
            }
          }]
        };
      } else if (style === "rose") {
        return {
          ...baseOption,
          series: [{
            name: metricLabels[metric],
            type: 'pie',
            radius: [40, 220],
            center: ['50%', '50%'],
            roseType: 'area',
            itemStyle: { borderRadius: 8, borderColor: currentTheme === 'dark' ? '#1a1a1a' : '#fff', borderWidth: 2 },
            data: validRows.map(r => ({ value: r[metric], name: r.name })),
            label: { show: labels.length < 15, color: theme.text, formatter: '{b}' }
          }]
        };
      } else if (style === "bubble") {
        const maxVal = Math.max(...values);
        return {
          ...baseOption,
          series: [{
            type: 'graph',
            layout: 'force',
            force: { repulsion: 200, edgeLength: 10 },
            data: validRows.map((r, i) => ({
              name: r.name,
              value: r[metric],
              symbolSize: Math.max(20, (r[metric] / (maxVal || 1)) * 130),
              itemStyle: { 
                color: theme.palette[i % theme.palette.length],
                shadowBlur: currentTheme === 'dark' ? 10 : 0, 
                shadowColor: theme.palette[i % theme.palette.length] 
              }
            }))
          }]
        };
      } else if (style === "treemap") {
        return {
          ...baseOption,
          series: [{
            name: metricLabels[metric],
            type: 'treemap',
            visibleMin: 300,
            label: { show: true, formatter: '{b}' },
            itemStyle: { borderColor: currentTheme === 'dark' ? '#1a1a1a' : '#fff', borderWidth: 1, gapWidth: 1 },
            upperLabel: { show: true, height: 30 },
            levels: [
              { itemStyle: { borderColor: theme.axisLine, borderWidth: 2, gapWidth: 2 } },
              { colorSaturation: [0.3, 0.6], itemStyle: { borderColorSaturation: 0.7, gapWidth: 1, borderWidth: 1 } }
            ],
            data: validRows.map(r => ({ name: r.name, value: r[metric] }))
          }]
        };
      }
      return baseOption;
    }

    function formatValue(val, metric) {
      if (metric === 'gdpPerCapita') return '$' + Number(val).toLocaleString();
      if (metric === 'population') return Number(val).toLocaleString();
      if (metric === 'internetUsers' || metric === 'gini') return Number(val).toFixed(1) + (metric === 'internetUsers' ? '%' : '');
      return Number(val).toLocaleString();
    }

    function formatCompact(val, metric) {
      if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'B';
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
      return val;
    }

    function switchChartStyle(style) {
      currentChartStyle = style;
      document.querySelectorAll(".style-btn").forEach(btn => btn.classList.remove("active"));
      const btn = document.querySelector('[data-style="' + style + '"]');
      if (btn) btn.classList.add("active");
      renderChart();
    }

    function switchMetric(metric) {
      currentMetric = metric;
      renderChart();
    }

    loadChart();
  </script>`;
};
