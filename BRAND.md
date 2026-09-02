<img src="assets/quello-mark.svg" alt="" width="52" align="left" hspace="14" vspace="4">

# Brand

[README](README.md) · [Compatibility](COMPATIBILITY.md) · [Features](FEATURES.md) ·
[Playgrounds](PLAYGROUNDS.md) · **Brand**

| File | Use |
| --- | --- |
| [`assets/quello-logo.svg`](assets/quello-logo.svg) | the wordmark — headers, the docs site, anywhere there is room to read it |
| [`assets/quello-mark.svg`](assets/quello-mark.svg) | the mark alone — favicons, avatars, the toolbar's collapsed puck |

The toolbar uses both: the wordmark on the toggle button when expanded — swapped for `picking…`
while picker mode is on — and the mark alone once collapsed.

<img src="assets/quello-logo.svg" alt="quello" width="200">

The mark is a lowercase **q** whose bowl is the picker's target ring, with the picked element as the
dot at its centre. The descender is load-bearing: without it the bowl and stem read as the lens and
handle of a magnifier, which would say *search* rather than *this one*.

The wordmark is built on the mark's grid — one stroke weight (2.9 units), one x-height (the bowl's
diameter), square caps and round joins throughout — so "uello" belongs to the same alphabet as the q
rather than being a typeface set next to it. The caps are the reason the weight can sit this high
without the mark going soft: they end each stroke flat, so the stem reads as cut rather than as a
blob at small sizes.

- **Colour** — amber, in two values. `#ffb020` on a dark ground, `#e09000` wherever the ground is
  unknown or light — the full amber is too weak on white. Both files ship in `#e09000` for that
  reason; for a single-colour context, recolour every stroke and fill at once. Anything set on the
  amber takes `#17191c`, not white: white on amber is 1.8:1, graphite on amber is 9.6:1.
- **Minimum size** — the mark holds down to 16px; the wordmark down to 14px tall. Below that use the
  mark alone.
- **Clear space** — leave the bowl's radius (a quarter of the height) on every side.

The runtime carries its own copies as `markSvg(height)` and `logoSvg(height)` in
[`packages/core/src/brand.ts`](packages/core/src/brand.ts), drawn in `currentColor` so they inherit
whatever they sit on.
