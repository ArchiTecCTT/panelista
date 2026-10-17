# Panelista brand brief (for Codex)

You are designing the visual identity for **Panelista**, a free Philippine web app.
Every year thousands of 4th-year BSIT / BSIS / BSCS students must find outside
"IT expert evaluators" (often 5 to 10 per group, usually 3+ or 5+ years of
experience) to rate their capstone system on an ISO/IEC 25010 questionnaire and
sign an acceptance form. Today they cold-message strangers on Facebook.
Panelista is the place where those students meet IT professionals and other
domain experts (QA, PMs, nurses for health systems, accountants for POS systems)
who volunteer as evaluators. Trust is Facebook Marketplace style: star ratings,
review counts, a "Verified" badge, "usually responds within a day".

Name meaning: "panelista" is Taglish for "panelist" (the defense panel).
Tone: friendly, credible, Filipino, student-friendly but professional. Simple.

## Deliverables (write ONLY inside this `brand/` folder)

1. `logo-mark.svg`: square app mark, `viewBox="0 0 64 64"`, flat vector, max
   3 colors, no text, no gradients that break at small sizes. Must read at
   16 px (favicon) and 512 px. Ideas to explore (pick the strongest, or
   combine): a panel table seen from the front with three heads, one with a
   check or star; a speech bubble holding a check mark and a star; a rounded
   square "P" whose counter is a star or a check. Avoid generic graduation
   caps and avoid anything that looks like an existing big brand.
2. `logo-mark-mono.svg`: same mark, single color `currentColor`, for dark/light use.
3. `logo-wordmark.svg`: mark plus the word "Panelista". Draw the letters as
   paths (hand-author them; no `<text>` element, no external font), geometric
   rounded sans feel, `viewBox` tight to the artwork, height-based (for example
   `0 0 260 64`).
4. `favicon.svg`: the mark tuned for 16 to 32 px (thicker strokes, fewer details).
5. `hero.svg`: a landing-page illustration, about `0 0 560 420`, flat 2D with a
   light isometric/3D feel: a student group presenting a laptop system to a small
   panel of evaluators (diverse Filipino faces, simple shapes, no realistic
   features), rating stars floating, a check-marked form. Under 40 KB.
6. `empty-inbox.svg`, `empty-projects.svg`, `verified.svg`: small spot
   illustrations, about `0 0 200 160`, under 12 KB each, same style.
7. `brand.json`: palette and usage, exactly this shape:
   `{ "primary": "#hex", "primaryDark": "#hex", "accent": "#hex", "star": "#hex",
      "ink": "#hex", "muted": "#hex", "surface": "#hex", "notes": "..." }`
   `primary` must reach WCAG AA (4.5:1) with white text; `star` is a warm
   amber for rating stars. Use these colors in every SVG.
8. `preview.html`: a single static page showing every asset on light and dark
   backgrounds and the mark at 16, 32, 64, 192 px.
9. `NOTES.md`: 5 to 10 lines on the concept and color choices.

## Hard rules

- Write only under `C:\dev\panelista\brand\`. Do not touch any other file.
- No git commands, no `npm install`, no network downloads.
- No em dash characters anywhere (in SVG comments, notes, html). Use commas or colons.
- Hand-author clean SVG: integer or 1-decimal coordinates, no embedded raster
  images, no fonts, `role="img"` and a `<title>` on each SVG.
- Keep every file small (sizes above). Validate each SVG is well-formed XML
  (a short node script with a regex/parse check is fine).
- When done, reply with: the list of files, their byte sizes, the chosen palette,
  and one sentence on the concept.
