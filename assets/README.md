# Profile banner

`hero-dark.svg` and `hero-light.svg` are the editable artwork and static fallbacks. The matching GIFs add a six-second loop of packets moving along the trace and soft node highlights. Text stays still; the first frame shows the static artwork. Both GIFs render at 1920 × 600 for sharp display on high-density screens.

The profile README selects `hero-static.svg` first for reduced motion, then the matching theme GIF for other visitors. The static image adapts its colors with CSS inside the SVG; it contains no animation or scripts and is also the general fallback. GitHub's own animation autoplay setting may also pause the GIF.

Keep the reduced-motion source separate and first: GitHub's `themed-picture` component can replace an entire color-scheme media query when applying a chosen theme, discarding any combined motion condition. The static fallback therefore handles its own colors without a color-scheme condition on its source.

The generated GIFs are committed, so viewing the profile requires no build service or third-party image API. To regenerate after editing the SVG artwork, install Node.js 22 or newer and FFmpeg, then run:

```sh
npm ci
npx playwright install chromium
npm run render:hero
```

To use an already installed Chrome, set `HERO_BROWSER_CHANNEL=chrome`. The artwork uses system fonts, so small font differences between operating systems are expected. The renderer writes frames to a temporary directory, encodes each theme using a shared palette, builds the adaptive static SVG from both source SVGs, and removes temporary files afterwards. Commit the two GIFs and `hero-static.svg` with the source artwork when changing the design.
