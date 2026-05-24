document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     BUILD NAVIGATION
  ========================== */

  let navLinks = "";

  Object.values(SITE_PAGES).forEach(page => {
    if (page.show) {
      navLinks += `<a href="${page.url}">${page.label}</a>`;
    }
  });

  /* =========================
     HEADER
  ========================== */

  const headerHTML = `
    <header>
      <div class="nav">
        <div class="logo">QUINTRIN</div>

        <nav>
          ${navLinks}
        </nav>
      </div>
    </header>
  `;

  /* =========================
     FOOTER
  ========================== */

  const footerHTML = `
    <footer>

      <p>
        <a href="/privacy.html">Privacy Policy</a> |
        <a href="/terms.html">Terms of Use</a> |
        <a href="/messaging-ai-notice.html">AI & Messaging Notice</a> |
        <a href="/contact.html">Contact</a>
      </p>

      <p>
        &copy; 2026 Quintrin Financial Services Ltd.
        All rights reserved.
      </p>

      <p>
        Quintrin provides independent structuring and facilitation services only.
        No brokerage, underwriting, fiduciary, or advisory services are offered.
      </p>

    </footer>
  `;

  /* =========================
     INJECT HEADER
  ========================== */

  const existingHeader = document.querySelector("header");

  if (existingHeader) {
    existingHeader.outerHTML = headerHTML;
  } else {
    document.body.insertAdjacentHTML("afterbegin", headerHTML);
  }

  /* =========================
     INJECT FOOTER
  ========================== */

  const existingFooter = document.querySelector("footer");

  if (existingFooter) {
    existingFooter.outerHTML = footerHTML;
  } else {
    document.body.insertAdjacentHTML("beforeend", footerHTML);
  }

});
