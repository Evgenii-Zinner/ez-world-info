import { html } from "hono/html";

export const Footer = () => {
  const year = new Date().getFullYear();
  return html`<footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <p class="footer-text">
          &copy; ${year} Evgenii Zinner • EZ World Info • Data sources: 
          <a href="https://restcountries.com" target="_blank" rel="noopener">Rest Countries</a>, 
          <a href="https://data.worldbank.org" target="_blank" rel="noopener">World Bank</a>, 
          <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a> &amp; 
          <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">ExchangeRate-API</a>
        </p>
      </div>
      
      <div class="footer-branding">
        <a href="https://ezinner.com" target="_blank" rel="noopener" class="footer-brand-link">EZ MADE</a>
        <span class="divider">|</span>
        <a href="https://hono.dev" target="_blank" rel="noopener" class="footer-link">Hono</a>
        <span class="divider">+</span>
        <a href="https://echarts.apache.org" target="_blank" rel="noopener" class="footer-link">Charts</a>
        <span class="divider">+</span>
        <a href="https://alpinejs.dev" target="_blank" rel="noopener" class="footer-link">Alpine.js</a>
        <span class="fire" title="Blazing Fast">🔥</span>
      </div>
    </div>
  </footer>`;
};
