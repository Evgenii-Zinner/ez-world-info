import { html } from "hono/html";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

type LayoutProps = {
  title: string;
  children: any;
};

export const Layout = ({ title, children }: LayoutProps) => {
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title} | EZ World Info - Global Metrics & Analysis</title>
        <meta name="description" content="EZ World Info - Comprehensive global metric dashboard and data analysis by Evgenii Zinner. Exploring GDP, Population, and Social Indicators with high-performance visualizations.">
        <link rel="canonical" href="https://ez-world.info" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://ez-world.info">
        <meta property="og:site_name" content="EZ World Info">
        <meta property="og:title" content="${title} | EZ World Info">
        <meta property="og:description" content="Comprehensive global metric dashboard and data analysis by Evgenii Zinner.">
        <meta property="og:image" content="https://ez-world.info/assets/og-image.jpg">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:locale" content="en_US">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:site" content="@EvgeniiZinner">
        <meta property="twitter:creator" content="@EvgeniiZinner">
        <meta property="twitter:url" content="https://ez-world.info">
        <meta property="twitter:title" content="${title} | EZ World Info">
        <meta property="twitter:description" content="Comprehensive global metric dashboard and data analysis by Evgenii Zinner.">
        <meta property="twitter:image" content="https://ez-world.info/assets/og-image.jpg">

        <!-- Unified JSON-LD Schema Graph -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://ez-world.info/#website",
              "url": "https://ez-world.info",
              "name": "EZ World Info",
              "publisher": { "@id": "https://ez-world.info/#organization" }
            },
            {
              "@type": "Organization",
              "@id": "https://ez-world.info/#organization",
              "name": "EZinner Solutions",
              "url": "https://ezinner.com",
              "logo": {
                "@type": "ImageObject",
                "@id": "https://ez-world.info/#logo",
                "url": "https://ez-world.info/favicon.svg",
                "width": 512,
                "height": 512
              }
            },
            {
              "@type": "Person",
              "@id": "https://ez-world.info/#person",
              "name": "Evgenii Zinner",
              "url": "https://ezinner.com",
              "jobTitle": "Senior Software Engineer",
              "sameAs": [
                "https://github.com/Evgenii-Zinner",
                "https://linkedin.com/in/evgenii-zinner/",
                "https://twitter.com/EvgeniiZinner"
              ]
            }
          ]
        }
        </script>

        <script>
          (function () {
            // Check localStorage first, then system preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
              document.documentElement.classList.add("theme-light");
            } else if (savedTheme === 'dark') {
              document.documentElement.classList.remove("theme-light");
            } else {
              // No saved preference, use system preference
              const prefersLight = window.matchMedia(
                "(prefers-color-scheme: light)"
              ).matches;
              if (prefersLight) {
                document.documentElement.classList.add("theme-light");
              }
            }
          })();
        </script>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="stylesheet" href="/fonts.css" />
        <link rel="stylesheet" href="/styles.css" />
        <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
      </head>
      <body>
        ${Navbar()}
        <main>
          ${children}
        </main>
        ${Footer()}
        <script src="https://unpkg.com/htmx.org@1.9.12" defer></script>
        <!-- Alpine Plugins -->
        <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/persist@3.x.x/dist/cdn.min.js"></script>
        <!-- Alpine Core -->
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <script>
          // Toggle theme
          function toggleTheme() {
            const isLight = document.documentElement.classList.toggle('theme-light');
            const theme = isLight ? 'light' : 'dark';
            localStorage.setItem('theme', theme);
            
            // Update icon
            const icon = document.querySelector('.theme-icon');
            if (icon) {
              icon.textContent = isLight ? '☀️' : '🌙';
            }
          }

          // Initialize theme icon on load
          (function() {
            const savedTheme = localStorage.getItem('theme');
            const isLight = savedTheme === 'light' || 
              (savedTheme === null && window.matchMedia('(prefers-color-scheme: light)').matches);
            const icon = document.querySelector('.theme-icon');
            if (icon) {
              icon.textContent = isLight ? '☀️' : '🌙';
            }
          })();


        </script>
      </body>
    </html>`;
};
