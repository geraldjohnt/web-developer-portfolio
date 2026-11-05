# Gerald John Tangpos — Full-Stack Developer Portfolio

A single-page developer portfolio built in plain HTML, CSS and JavaScript. Live at https://geraldjohnt.github.io/web-developer-portfolio/

## Files
- `index.html` — page content (hero, about, skills, experience, projects, business support, contact)
- `style.css` — styles and responsive breakpoints
- `script.js` — smooth in-page scrolling (respects reduced-motion) and the footer year
- `.github/workflows/static.yml` — deploys the site to GitHub Pages on every push to `main`

## Run it
Open `index.html` in a browser. No build step.

## Linked portfolio
This site links to the Virtual Assistant & Automation portfolio (https://geraldjohnt.github.io/va-portfolio/) from the hero switch,
the nav, the `#business-support` section, the contact links and the footer. That site links back here
the same way, so visitors can move between the two.

## Contact form
`contact-form.js` posts to the Google Apps Script web app set in `data-endpoint` on `#contact-form`. The script and
setup guide live in the VA portfolio repo: https://github.com/geraldjohnt/va-portfolio/tree/main/apps-script.
With no endpoint set, the form opens a pre-filled email instead.

## Version 2 (preview)
`version2.html` is a redesign that sits next to the live `index.html` without replacing it. Open it at
https://geraldjohnt.github.io/web-developer-portfolio/version2.html once deployed.
- Editor-style page in arc blue and copper: the hero component types itself out in a code editor and each finished
  line "compiles" its part of the page; sections compile as they scroll in; experience is a `git log --graph`;
  "How I work" runs as a CI pipeline.
- A small terminal under the editor accepts commands (`help`, `whoami`, `skills`, `projects`, `contact`, `sudo hire-me`…),
  and Ctrl+K (⌘K on Mac) opens a command palette.
- Files: `v2/dev.css`, `v2/dev.js` and `v2/gerald-cutout.webp`. Typing sounds are synthesized with the Web Audio API
  and can be switched off from the top bar.
- Visitors with reduced motion turned on, and browsers without JavaScript, get the finished page right away.
