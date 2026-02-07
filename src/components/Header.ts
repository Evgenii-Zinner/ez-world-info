import { html } from "hono/html";

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export const Header = ({ title, subtitle }: HeaderProps) => {
  return html`<header>
    <h1>${title}</h1>
    ${subtitle ? html`<div class="meta">${subtitle}</div>` : ""}
  </header>`;
};
