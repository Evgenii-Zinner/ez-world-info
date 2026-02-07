import { html } from "hono/html";

export const Navbar = () => {
  return html`<nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-logo">
        <span class="logo-text">EZ World Info</span>
      </div>
      <ul class="navbar-menu">
        <li><a href="/?tab=table" class="nav-link" data-tab="table">Table</a></li>
        <li><a href="/chart" class="nav-link" data-tab="chart">Chart</a></li>
        <li>
          <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
            <span class="theme-icon">🌙</span>
          </button>
        </li>
      </ul>
    </div>
    <script>
      (function() {
        // Highlight active tab based on URL
        const updateActiveTab = () => {
          const path = window.location.pathname;
          const params = new URLSearchParams(window.location.search);
          const tabParam = params.get('tab');
          
          let currentTab = 'table';
          if (path.includes('/chart') || tabParam === 'chart') {
            currentTab = 'chart';
          } else if (path === '/' && tabParam === 'table') {
            currentTab = 'table';
          } else if (path === '/') {
            currentTab = 'table';
          }
          
          document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.tab === currentTab) {
              link.classList.add('active');
            }
          });
        };

        updateActiveTab();
      })();
    </script>
  </nav>`;
};
