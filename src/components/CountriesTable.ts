import type { CountryRow } from "../types";

type TableProps = {
  rows?: CountryRow[]; // Made optional
  sortBy?: string | null;
  sortOrder?: "asc" | "desc";
  filter?: "all" | "selected";
  loadingRates?: boolean;
  showControls?: boolean;
  enableSorting?: boolean;
};

/**
 * Renders the main data table shell and its Alpine.js component logic.
 *
 * This component utilizes the "JSON Island pattern" for hydration:
 * Large server-side datasets are serialized into a hidden <script type="application/json">
 * tag rather than being directly interpolated into HTML attributes. Alpine.js then parses
 * this tag on initialization. This avoids massive HTML bloat and improves rendering performance.
 *
 * @param props.rows - Server-side data array. If empty, Alpine will fetch data client-side.
 * @param props.loadingRates - Optional flag for UI state.
 * @param props.showControls - Whether to render the search/filter header controls.
 * @returns The complete HTML string for the table component.
 */
export function renderTable({
  rows = [], // Default to empty
  loadingRates = false,
  showControls = true,
}: TableProps): string {
  // If rows are provided server-side (e.g. for HTMX partials), use them.
  // Otherwise, default to empty array and let Alpine fetch.

  // Safe JSON injection using script tag to prevent XSS in HTML attributes
  // Note: \u2028 (Line Separator) and \u2029 (Paragraph Separator) must be explicitly
  // escaped because they are valid JSON but cause fatal SyntaxErrors if left unescaped
  // inside an HTML <script> block, breaking the entire JS execution context.
  const safeJson = JSON.stringify(rows)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const dataId = 'data-' + Math.random().toString(36).substr(2, 9);
  const hasInitialData = rows.length > 0;

  return `
    <script>
      (function() {
        const registerComponent = () => {
          if (Alpine.data('countriesTable')) return;

          // ⚡ Cache formatters outside of Alpine reactive state to prevent proxy overhead
          // and unnecessary reactivity cycles when initializing them.
          const formattersCache = {};

          const FORMULA_INJECTION_REGEX = /^[=+\-@]/;

          Alpine.data('countriesTable', (initialDataOrId, hasServerData) => ({
            allRows: [], // Initialize empty
            isLoading: !hasServerData,
            filter: 'all',
            sortBy: 'name',
            sortOrder: 'asc',
            // ⚠️ CRITICAL: When changing the default value of an Alpine.$persist property,
            // you MUST update the .as('alias_name') string. Otherwise, returning users
            // will continue to load their old, stale cached value from localStorage
            // instead of your new default.
            selected: Alpine.$persist([]).as('selectedCountries'),
            search: '',
            hiddenColumns: Alpine.$persist(['col-gdp-total', 'col-gini', 'col-internet', 'col-urban']).as('hiddenColumns'),
            showColumnSettings: false,
            copiedCode: null,
            linkCopied: false,

            async init() {
              // Initialize data safely
              if (typeof initialDataOrId === 'string') {
                const el = document.getElementById(initialDataOrId);
                if (el) {
                  try {
                    this.allRows = JSON.parse(el.textContent);
                  } catch(e) {
                    console.error('Failed to parse initial data', e);
                  }
                }
              } else {
                 // Legacy or direct array support
                 this.allRows = initialDataOrId || [];
              }

              // Check URL for filter param
              const params = new URLSearchParams(window.location.search);
              if (params.get('filter') === 'selected') {
                  this.filter = 'selected';
              }
              const urlSelected = params.get('selected');
              if (urlSelected) {
                  this.selected = urlSelected.split(',').filter(Boolean);
              }
              const urlSearch = params.get('search');
              if (urlSearch) {
                  this.search = urlSearch;
              }

              if (hasServerData) return;

              // Check Session Storage
              const cached = sessionStorage.getItem('countriesData');
              if (cached) {
                try {
                  this.allRows = JSON.parse(cached);
                  this.isLoading = false;
                  return;
                } catch (e) {
                  console.error('Failed to parse cached data', e);
                  sessionStorage.removeItem('countriesData');
                }
              }

              // Fetch from API
              try {
                const res = await fetch('/api/countriesData');
                if (!res.ok) throw new Error('Failed to load data');
                const data = await res.json();
                this.allRows = data;
                try {
                    sessionStorage.setItem('countriesData', JSON.stringify(data));
                } catch (e) {
                    console.warn('Failed to save to sessionStorage (quota exceeded?)', e);
                }
              } catch (err) {
                console.error(err);
                // Handle error state if needed
              } finally {
                this.isLoading = false;
              }
            },


            get aggregates() {
              if (!this._aggregatesCache) {
                  const rows = this.filteredRows;
                  let pop = 0;
                  let area = 0;
                  let gdp = 0;
                  for (const r of rows) {
                    if (r.population) pop += r.population;
                    if (r.area) area += r.area;
                    if (r.gdpTotal) gdp += r.gdpTotal;
                  }
                  this._aggregatesCache = { population: pop, area: area, gdpTotal: gdp };
              }
              return this._aggregatesCache;
            },

            get filteredRows() {
              this._aggregatesCache = null;
              let result = this.allRows;

              // 1. Text Search
              if (this.search) {
                const lowerSearch = this.search.toLowerCase();
                result = result.filter(r => 
                  (r.name && r.name.toLowerCase().includes(lowerSearch)) || 
                  (r.code && r.code.toLowerCase().includes(lowerSearch))
                );
              }

              // 2. Selection Filter
              if (this.filter === 'selected') {
                const selectedSet = new Set(this.selected);
                result = result.filter(r => selectedSet.has(r.code));
              }

              // 3. Sorting
              if (this.sortBy) {
                result = result.sort((a, b) => {
                  let valA = a[this.sortBy];
                  let valB = b[this.sortBy];

                  // Handle nulls always at bottom
                  if (valA === null || valA === undefined) return 1;
                  if (valB === null || valB === undefined) return -1;

                  if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                  }

                  if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
                  if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
                  return 0;
                });
              }

              return result;
            },

            copyToClipboard(text) {
              if (!text) return;
              navigator.clipboard.writeText(text).then(() => {
                this.copiedCode = text;
                setTimeout(() => {
                  this.copiedCode = null;
                }, 2000);
              }).catch(err => {
                console.error('Failed to copy: ', err);
              });
            },

            copyShareLink() {
              const url = new URL(window.location.href);
              url.searchParams.delete('selected');
              url.searchParams.delete('filter');
              url.searchParams.delete('search');

              if (this.selected.length > 0) {
                url.searchParams.set('selected', this.selected.join(','));
              }
              if (this.filter && this.filter !== 'all') {
                url.searchParams.set('filter', this.filter);
              }
              if (this.search) {
                url.searchParams.set('search', this.search);
              }

              navigator.clipboard.writeText(url.toString()).then(() => {
                this.linkCopied = true;
                setTimeout(() => {
                  this.linkCopied = false;
                }, 2000);
              }).catch(err => {
                console.error('Failed to copy link: ', err);
              });
            },

            toggleSelection(code) {
              if (this.selected.includes(code)) {
                this.selected = this.selected.filter(c => c !== code);
              } else {
                this.selected.push(code);
              }
            },

            clearSelection() {
              this.selected = [];
            },

            toggleSelectAll() {
              const displayedCodes = this.filteredRows.map(r => r.code);
              const allSelected = displayedCodes.every(code => this.selected.includes(code));

              if (allSelected) {
                // Deselect all visible
                this.selected = this.selected.filter(code => !displayedCodes.includes(code));
              } else {
                // Select all visible
                const toAdd = displayedCodes.filter(code => !this.selected.includes(code));
                this.selected = [...this.selected, ...toAdd];
              }
            },

            sort(key) {
              if (this.sortBy === key) {
                if (this.sortOrder === 'asc') {
                  this.sortOrder = 'desc';
                } else {
                  this.sortBy = null; // 3rd click to reset
                  this.sortOrder = 'asc';
                }
              } else {
                this.sortBy = key;
                this.sortOrder = 'asc';
              }
            },

            toggleColumn(colName) {
              if (this.hiddenColumns.includes(colName)) {
                this.hiddenColumns = this.hiddenColumns.filter(c => c !== colName);
              } else {
                this.hiddenColumns.push(colName);
              }
            },

            _getFormatter(type, currency = 'USD') {
              const key = type + '_' + currency;
              if (!formattersCache[key]) {
                if (type === 'currency') {
                  formattersCache[key] = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, maximumFractionDigits: 0 });
                } else if (type === 'compact') {
                  formattersCache[key] = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, notation: 'compact', maximumFractionDigits: 1 });
                } else if (type === 'number') {
                  formattersCache[key] = new Intl.NumberFormat('en-US');
                }
              }
              return formattersCache[key];
            },

            formatCurrency(val, currency = 'USD') {
              if (val === null || val === undefined) return 'n/a';
              return this._getFormatter('currency', currency).format(val);
            },

            formatCompact(val, currency = 'USD') {
              if (val === null || val === undefined) return 'n/a';
              return this._getFormatter('compact', currency).format(val);
            },

            formatNumber(val) {
              if (val === null || val === undefined) return 'n/a';
              return this._getFormatter('number', '').format(val);
            },

            formatPercent(val) {
              if (val === null || val === undefined) return 'n/a';
              return val.toFixed(1) + '%';
            },
            
            formatRate(val) {
              if (val === null || val === undefined) return '...'; 
              return val.toFixed(2);
            },

            getExportData() {
              const rows = this.filteredRows;
              if (!rows || rows.length === 0) return null;

              const getLanguage = (row) => {
                if (row.languages && Object.keys(row.languages).length > 0) {
                  return Object.values(row.languages).slice(0, 2).join(', ');
                }
                return row.officialLanguage || '';
              };

              const getStatus = (row) => {
                return row.parentCountry || (row.independent ? 'Independent' : 'Dependent');
              };

              return rows.map(row => ({
                name: row.name,
                code: row.code,
                population: row.population,
                area: row.area,
                currencyRate: row.currencyRate,
                language: getLanguage(row),
                gdpPerCapita: row.gdpPerCapita,
                gdpTotal: row.gdpTotal,
                gini: row.gini,
                internetUsers: row.internetUsers,
                urbanPopulation: row.urbanPopulation,
                status: getStatus(row)
              }));
            },

            exportCSV() {
              const exportData = this.getExportData();
              if (!exportData) return;

              const headers = [
                'Country', 'Code', 'Population', 'Area (km²)', 'Currency Rate (USD)',
                'Official Language', 'GDP per Capita', 'GDP Total', 'Gini',
                'Internet Users %', 'Urban Pop %', 'Status'
              ];

              const escape = (val) => {
                if (val === null || val === undefined) return '';
                let str = String(val);

                // Prevent CSV Injection (Formula Injection)
                // If a malicious user sets their name to "=CMD|' /C calc'!A0",
                // Excel would execute it. Prepending a single quote forces Excel
                // to treat the cell as raw text instead of an executable formula.
                if (FORMULA_INJECTION_REGEX.test(str)) {
                  str = "'" + str;
                }

                if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
                  return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
              };

              const csvContent = [
                headers.join(','),
                ...exportData.map(row => [
                  escape(row.name),
                  escape(row.code),
                  escape(row.population),
                  escape(row.area),
                  escape(row.currencyRate),
                  escape(row.language),
                  escape(row.gdpPerCapita),
                  escape(row.gdpTotal),
                  escape(row.gini),
                  escape(row.internetUsers),
                  escape(row.urbanPopulation),
                  escape(row.status)
                ].join(','))
              ].join('\\n');

              this.downloadFile(csvContent, 'text/csv;charset=utf-8;', 'csv');
            },

            exportJSON() {
              const exportData = this.getExportData();
              if (!exportData) return;

              const jsonContent = JSON.stringify(exportData, null, 2);
              this.downloadFile(jsonContent, 'application/json;charset=utf-8;', 'json');
            },

            downloadFile(content, mimeType, extension) {
              const blob = new Blob([content], { type: mimeType });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", 'world_data_export_' + new Date().toISOString().slice(0,10) + '.' + extension);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(url), 100);
            }
          }));
        };

        if (typeof Alpine !== 'undefined') {
          registerComponent();
        } else {
          document.addEventListener('alpine:init', registerComponent);
        }
      })();
    </script>

    <script id="${dataId}" type="application/json">${safeJson}</script>
    <div x-data="countriesTable('${dataId}', ${hasInitialData})" class="table-container">

      ${showControls ? `
      <div class="table-header-controls">
        <div class="table-actions-left">
          <div class="table-filters" role="group" aria-label="Filter countries">
            <button 
              class="filter-btn" 
              :class="{ 'active': filter === 'all' }" 
              :aria-pressed="filter === 'all'"
              @click="filter = 'all'"
            >All</button>
            <button 
              class="filter-btn" 
              :class="{ 'active': filter === 'selected' }" 
              :aria-pressed="filter === 'selected'"
              @click="filter = 'selected'"
            >Selected</button>
          </div>
          <div class="selection-count" aria-live="polite" x-show="selected.length > 0" x-text="'✓ ' + selected.length + ' selected'"></div>
        </div>
        
        <div class="table-actions-right" style="display: flex; gap: 12px; align-items: center; position: relative;">
             <input type="text" x-model="search" placeholder="Search..." aria-label="Search countries" class="search-input" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #444; background: transparent; color: inherit; flex: 1; min-width: 0;">

            <button class="btn-column-settings" style="white-space: nowrap; flex-shrink: 0; min-width: max-content;" x-show="selected.length > 0" @click="clearSelection()" aria-label="Clear selection">❌ Clear</button>
            <button class="btn-column-settings" style="white-space: nowrap; flex-shrink: 0; min-width: max-content;" @click="copyShareLink()" x-text="linkCopied ? '✅ Copied!' : '🔗 Copy Link'"></button>
            <button class="btn-column-settings" style="white-space: nowrap; flex-shrink: 0; min-width: max-content;" @click="exportCSV()">⬇️ CSV</button>
            <button class="btn-column-settings" style="white-space: nowrap; flex-shrink: 0; min-width: max-content;" @click="exportJSON()">⬇️ JSON</button>
            <button class="btn-column-settings" style="white-space: nowrap; flex-shrink: 0; min-width: max-content;" :aria-expanded="showColumnSettings" aria-controls="column-settings-menu" aria-haspopup="menu" @click="showColumnSettings = !showColumnSettings">⚙️ Columns</button>
            
            <div id="column-settings-menu" x-show="showColumnSettings" @click.outside="showColumnSettings = false" class="column-settings-panel" style="display: none;">
                <div class="column-settings-content">
                <h3>Show/Hide Columns</h3>
                <div class="column-options">
                    <template x-for="col in [
                        {id: 'col-country', label: 'Country'},
                        {id: 'col-code', label: 'Code'},
                        {id: 'col-population', label: 'Population'},
                        {id: 'col-area', label: 'Area'},
                        {id: 'col-currencies', label: '1 USD ='},
                        {id: 'col-language', label: 'Official Language'},
                        {id: 'col-gdp', label: 'GDP per Capita'},
                        {id: 'col-gdp-total', label: 'GDP Total'},
                        {id: 'col-gini', label: 'Gini'},
                        {id: 'col-internet', label: 'Internet Users %'},
                        {id: 'col-urban', label: 'Urban Population %'},
                        {id: 'col-status', label: 'Status'},
                        {id: 'col-flag', label: 'Flag'}
                    ]">
                    <label>
                        <input type="checkbox" 
                            :checked="!hiddenColumns.includes(col.id)" 
                            @change="toggleColumn(col.id)"
                        > <span x-text="col.label"></span>
                    </label>
                    </template>
                </div>
                </div>
            </div>
        </div>
      </div>
      ` : ''}

      <div x-show="isLoading" class="loading">
        Loading data...
      </div>

      <table x-show="!isLoading">
        <thead>
          <tr>
            <th
              class="select-all-header"
              @click="toggleSelectAll()"
              @keydown.enter.prevent="toggleSelectAll()"
              @keydown.space.prevent="toggleSelectAll()"
              tabindex="0"
              aria-label="Select all rows"
              scope="col"
              style="cursor: pointer; user-select: none;">✓</th>
            
            <th
              class="sortable-header"
              @click="sort('name')"
              @keydown.enter.prevent="sort('name')"
              @keydown.space.prevent="sort('name')"
              :aria-sort="sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'name', 'sort-asc': sortBy === 'name' && sortOrder === 'asc', 'sort-desc': sortBy === 'name' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-country')"
              style="cursor: pointer;">Country</th>

            <th
              class="sortable-header"
              @click="sort('code')"
              @keydown.enter.prevent="sort('code')"
              @keydown.space.prevent="sort('code')"
              :aria-sort="sortBy === 'code' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'code', 'sort-asc': sortBy === 'code' && sortOrder === 'asc', 'sort-desc': sortBy === 'code' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-code')"
              style="cursor: pointer;">Code</th>

            <th
              class="sortable-header"
              @click="sort('population')"
              @keydown.enter.prevent="sort('population')"
              @keydown.space.prevent="sort('population')"
              :aria-sort="sortBy === 'population' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'population', 'sort-asc': sortBy === 'population' && sortOrder === 'asc', 'sort-desc': sortBy === 'population' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-population')"
              style="cursor: pointer;">Population</th>

            <th
              class="sortable-header"
              @click="sort('area')"
              @keydown.enter.prevent="sort('area')"
              @keydown.space.prevent="sort('area')"
              :aria-sort="sortBy === 'area' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'area', 'sort-asc': sortBy === 'area' && sortOrder === 'asc', 'sort-desc': sortBy === 'area' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-area')"
              style="cursor: pointer;">Area (km²)</th>

            <th
              class="sortable-header"
              @click="sort('currencyRate')"
              @keydown.enter.prevent="sort('currencyRate')"
              @keydown.space.prevent="sort('currencyRate')"
              :aria-sort="sortBy === 'currencyRate' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'currencyRate', 'sort-asc': sortBy === 'currencyRate' && sortOrder === 'asc', 'sort-desc': sortBy === 'currencyRate' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-currencies')"
              style="cursor: pointer;">1 USD =</th>

            <th
              class="sortable-header"
              @click="sort('officialLanguage')"
              @keydown.enter.prevent="sort('officialLanguage')"
              @keydown.space.prevent="sort('officialLanguage')"
              :aria-sort="sortBy === 'officialLanguage' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'officialLanguage', 'sort-asc': sortBy === 'officialLanguage' && sortOrder === 'asc', 'sort-desc': sortBy === 'officialLanguage' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-language')"
              style="cursor: pointer;">Official Language</th>

            <th
              class="sortable-header"
              @click="sort('gdpPerCapita')"
              @keydown.enter.prevent="sort('gdpPerCapita')"
              @keydown.space.prevent="sort('gdpPerCapita')"
              :aria-sort="sortBy === 'gdpPerCapita' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'gdpPerCapita', 'sort-asc': sortBy === 'gdpPerCapita' && sortOrder === 'asc', 'sort-desc': sortBy === 'gdpPerCapita' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-gdp')"
              style="cursor: pointer;">GDP per Capita</th>

            <th
              class="sortable-header"
              @click="sort('gdpTotal')"
              @keydown.enter.prevent="sort('gdpTotal')"
              @keydown.space.prevent="sort('gdpTotal')"
              :aria-sort="sortBy === 'gdpTotal' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'gdpTotal', 'sort-asc': sortBy === 'gdpTotal' && sortOrder === 'asc', 'sort-desc': sortBy === 'gdpTotal' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-gdp-total')"
              style="cursor: pointer;">GDP Total</th>

            <th
              class="sortable-header"
              @click="sort('gini')"
              @keydown.enter.prevent="sort('gini')"
              @keydown.space.prevent="sort('gini')"
              :aria-sort="sortBy === 'gini' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'gini', 'sort-asc': sortBy === 'gini' && sortOrder === 'asc', 'sort-desc': sortBy === 'gini' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-gini')"
              style="cursor: pointer;">Gini</th>

            <th
              class="sortable-header"
              @click="sort('internetUsers')"
              @keydown.enter.prevent="sort('internetUsers')"
              @keydown.space.prevent="sort('internetUsers')"
              :aria-sort="sortBy === 'internetUsers' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'internetUsers', 'sort-asc': sortBy === 'internetUsers' && sortOrder === 'asc', 'sort-desc': sortBy === 'internetUsers' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-internet')"
              style="cursor: pointer;">Internet Users %</th>

            <th
              class="sortable-header"
              @click="sort('urbanPopulation')"
              @keydown.enter.prevent="sort('urbanPopulation')"
              @keydown.space.prevent="sort('urbanPopulation')"
              :aria-sort="sortBy === 'urbanPopulation' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'urbanPopulation', 'sort-asc': sortBy === 'urbanPopulation' && sortOrder === 'asc', 'sort-desc': sortBy === 'urbanPopulation' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-urban')"
              style="cursor: pointer;">Urban Pop %</th>

            <th
              class="sortable-header"
              @click="sort('status')"
              @keydown.enter.prevent="sort('status')"
              @keydown.space.prevent="sort('status')"
              :aria-sort="sortBy === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
              tabindex="0"
              scope="col"
              :class="{'active': sortBy === 'status', 'sort-asc': sortBy === 'status' && sortOrder === 'asc', 'sort-desc': sortBy === 'status' && sortOrder === 'desc'}"
              x-show="!hiddenColumns.includes('col-status')"
              style="cursor: pointer;">Status</th>

            <th x-show="!hiddenColumns.includes('col-flag')" class="flag-header" scope="col">Flag</th>
          </tr>
        </thead>
        <tbody>
           <template x-for="row in filteredRows" :key="row.code">
            <tr :class="{'row-selected': selected.includes(row.code)}" :data-country="row.code">
                <td>
                    <input 
                    type="checkbox" 
                    :value="row.code"
                    class="country-checkbox"
                    :aria-label="'Select ' + row.name"
                    :checked="selected.includes(row.code)"
                    @change="toggleSelection(row.code)"
                    />
                </td>
                <td x-text="row.name" x-show="!hiddenColumns.includes('col-country')"></td>
                <td x-show="!hiddenColumns.includes('col-code')"
                    class="code-cell"
                    role="button"
                    tabindex="0"
                    :aria-label="'Copy code ' + row.code"
                    @click="copyToClipboard(row.code)"
                    @keydown.enter.prevent="copyToClipboard(row.code)"
                    @keydown.space.prevent="copyToClipboard(row.code)"
                    title="Click to copy code">
                   <span x-text="row.code"></span>
                   <span x-show="copiedCode === row.code" class="copy-feedback" x-transition.opacity.duration.300ms>Copied!</span>
                </td>
                <td x-text="formatNumber(row.population)" x-show="!hiddenColumns.includes('col-population')"></td>
                <td x-text="formatNumber(row.area)" x-show="!hiddenColumns.includes('col-area')"></td>
                
                <td class="currency-cell" x-show="!hiddenColumns.includes('col-currencies')">
                   <span x-text="formatRate(row.currencyRate)"></span>
                </td>

                <td x-show="!hiddenColumns.includes('col-language')">
                    <template x-if="row.languages">
                        <span x-text="Object.values(row.languages).slice(0, 2).join(', ')"></span>
                    </template>
                    <template x-if="!row.languages">
                        <span x-text="row.officialLanguage || 'n/a'"></span>
                    </template>
                </td>
                
                <td x-text="formatCurrency(row.gdpPerCapita)" x-show="!hiddenColumns.includes('col-gdp')"></td>
                <td x-text="formatCompact(row.gdpTotal)" x-show="!hiddenColumns.includes('col-gdp-total')"></td>
                
                <td x-text="row.gini ? row.gini.toFixed(1) : 'n/a'" x-show="!hiddenColumns.includes('col-gini')"></td>
                <td x-text="formatPercent(row.internetUsers)" x-show="!hiddenColumns.includes('col-internet')"></td>
                <td x-text="formatPercent(row.urbanPopulation)" x-show="!hiddenColumns.includes('col-urban')"></td>
                
                <td class="status-cell" x-show="!hiddenColumns.includes('col-status')">
                  <span x-text="row.parentCountry || (row.independent ? 'Independent' : '—')"></span>
                </td>

                <td class="flag-cell" x-show="!hiddenColumns.includes('col-flag')">
                    <template x-if="row.flagSvg">
                        <img :src="row.flagSvg" :alt="row.name" class="flag-svg" />
                    </template>
                    <template x-if="!row.flagSvg">
                        <span>🏳️</span>
                    </template>
                </td>
            </tr>
           </template>
           <tr x-show="!isLoading && filteredRows.length === 0">
             <td colspan="14" style="text-align: center; padding: 20px; color: #888;">No countries found matching your criteria.</td>
           </tr>
        </tbody>

        <tfoot class="table-aggregates" x-show="!isLoading && filteredRows.length > 0">
          <tr>
            <td></td>
            <td x-show="!hiddenColumns.includes('col-country')">Totals</td>
            <td x-show="!hiddenColumns.includes('col-code')"></td>
            <td x-show="!hiddenColumns.includes('col-population')" x-text="formatNumber(aggregates.population)"></td>
            <td x-show="!hiddenColumns.includes('col-area')" x-text="formatNumber(aggregates.area)"></td>
            <td x-show="!hiddenColumns.includes('col-currencies')"></td>
            <td x-show="!hiddenColumns.includes('col-language')"></td>
            <td x-show="!hiddenColumns.includes('col-gdp')"></td>
            <td x-show="!hiddenColumns.includes('col-gdp-total')" x-text="formatCompact(aggregates.gdpTotal)"></td>
            <td x-show="!hiddenColumns.includes('col-gini')"></td>
            <td x-show="!hiddenColumns.includes('col-internet')"></td>
            <td x-show="!hiddenColumns.includes('col-urban')"></td>
            <td x-show="!hiddenColumns.includes('col-status')"></td>
            <td x-show="!hiddenColumns.includes('col-flag')"></td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}
