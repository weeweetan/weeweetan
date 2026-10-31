# Profile banner

`hero-dark.svg` and `hero-light.svg` are the editable artwork and static fallbacks. The matching GIFs add a six-second loop of packets moving along the trace and soft node highlights. Text stays still; the first frame shows the static artwork. Both GIFs render at 1920 × 600 for sharp display on high-density screens.

The profile banner intentionally stays dark in every GitHub or system theme. The README selects `hero-dark.svg` for reduced motion and `hero-dark.gif` for other visitors, with the dark SVG as the general fallback. GitHub's own animation autoplay setting may also pause the GIF. This controls the banner artwork; the surrounding GitHub page follows each visitor's appearance settings.

Keep the reduced-motion source separate and first. Do not add color-scheme sources to the banner: they would reintroduce the light background. The light artwork and adaptive `hero-static.svg` remain available as optional variants, but the profile does not select them.

The generated GIFs are committed, so viewing the profile requires no build service or third-party image API. To regenerate after editing the SVG artwork, install Node.js 22 or newer and FFmpeg, then run:

```sh
npm ci
npx playwright install chromium
npm run render:hero
```

To use an already installed Chrome, set `HERO_BROWSER_CHANNEL=chrome`. The artwork uses system fonts, so small font differences between operating systems are expected. The renderer writes frames to a temporary directory, encodes each theme using a shared palette, builds the adaptive static SVG from both source SVGs, and removes temporary files afterwards. Commit the two GIFs and `hero-static.svg` with the source artwork when changing the design.
