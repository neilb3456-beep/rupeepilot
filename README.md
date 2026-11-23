# RupeePilot

An India-first money and everyday calculator website built with plain HTML, CSS and vanilla JavaScript. No build step, package manager, framework, backend or API key is required.

## Included

- EMI calculator (reducing-balance formula)
- SIP future-value estimate (monthly contribution, monthly compounding assumption)
- FD and RD estimates (simplified monthly compounding / annuity model)
- Salary budget split
- GST add/extract calculator
- Discount calculator
- Percentage calculator
- Age calculator
- Responsive dark premium UI
- About, Privacy, Terms, Advertising & Affiliate Disclosure, and Contact pages
- SEO metadata, favicon, robots.txt and sitemap template

## Run locally

Open `index.html` in a browser, or run a local server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. This project is configured for `neilb3456-beep/rupeepilot`. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select branch `main` and folder `/(root)`, then Save. Wait for the Pages deployment. Your URL will look like `https://neilb3456-beep.github.io/rupeepilot/`.

GitHub's official guide: https://docs.github.com/en/pages/quickstart

## Required owner edits before launch

The canonical URL, sitemap and robots.txt are preconfigured for this repository at `https://neilb3456-beep.github.io/rupeepilot/`.

- Add a monitored support/privacy email address to `contact.html`, `privacy.html` and `about.html` before monetisation applications.
- Review every legal/disclosure page against the services you actually use.
- Review every legal/disclosure page against the services you actually use.
- If using a custom domain, configure it in GitHub Pages settings and update canonical URLs, sitemap and robots.txt.

## Monetization setup (do not skip approval)

### AdSense
This code contains no active AdSense script and no fake publisher ID. Apply at https://adsense.google.com/ after you have a complete site with substantial original, useful content, working navigation, real contact details and accurate policy pages. The starter FAQ is not a substitute for a real editorial library: publish genuinely useful, reviewed explainers and examples before applying. Google says applicants need their own high-quality original content and must be at least 18; if the publisher is under 18, a parent or guardian must own the AdSense account. If approved, insert the official code and your own publisher ID in the location specified by Google. Follow current AdSense policies.

### Affiliate programmes
Apply directly to programmes whose products genuinely fit your audience. Add only your own approved tracking URLs. Place a clear disclosure next to affiliate links and keep the full disclosure page updated. Never copy IDs or links from another publisher.

### Revenue reality check
₹2,000/week is a target, not a forecast. Revenue depends on traffic, audience geography, niche, ad demand, page RPM, user intent, conversion rate, commission and seasonality. Use your own analytics and actual programme dashboards; do not buy bot traffic, click your own ads, incentivize ad clicks or promise financial outcomes.

A simple scenario formula for display ads is:

`weekly ad revenue ≈ weekly page views ÷ 1,000 × actual page RPM`

For example, if the measured page RPM were ₹50, 40,000 page views in a week would mathematically correspond to ₹2,000 before any costs or taxes. ₹50 is only a hypothetical input, not an India RPM benchmark or prediction.

## Technical notes and limitations

- All calculations are estimates and are intentionally client-side.
- SIP results assume a fixed monthly rate derived from the entered annual rate and a simplified beginning-of-month contribution convention (each contribution receives one extra monthly compounding step). Real investment returns are not fixed or guaranteed.
- FD/RD estimates simplify institution-specific compounding, deposit timing, tax and payout rules. Verify with the bank.
- GST calculator does not decide which GST rate applies.
- The salary planner is a user-defined budget split, not an income-tax calculator.
- The current site has no live currency API, no login, no server, no analytics, no newsletter collection and no active ads.
- Search engines need useful original content, discoverability and time. A calculator UI alone does not guarantee rankings or income.

## GitHub project references reviewed

These are inspiration/research references, not dependencies copied into this project:

- https://github.com/Itsmeankita/Virtual-Calculator — broad browser-based calculator suite using HTML/CSS/JS.
- https://github.com/nam3isrobin/FlowFinance — SIP/EMI calculator UI and financial projections.
- https://github.com/Kunal17711/gst-calculator — GST calculator implementation reference.
- https://github.com/HarrietNditii/calculator — accessible, offline-friendly vanilla JavaScript calculator.

Review each repository's current license and code before reusing any source. This project is independently written for this deliverable.

## License

MIT. See `LICENSE`.
