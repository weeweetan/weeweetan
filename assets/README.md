# Profile banner

`hero-dark.svg` and `hero-light.svg` are the editable artwork and static fallbacks. The matching GIFs add a six-second loop of packets moving along the trace and soft node highlights. Text stays still; the first frame shows the static artwork. Both GIFs render at 1920 × 600 for sharp display on high-density screens.

The profile README selects GIFs only when the visitor allows motion. It uses the matching static SVG for reduced motion, and a static image as the general fallback. GitHub's own animation autoplay setting may also pause the GIF.

The generated GIFs are committed, so viewing the profile requires no build service or third-party image API. To regenerate after editing the SVG artwork, install Node.js 22 or newer and FFmpeg, then run:

```sh
npm ci
npx playwright install chromium
npm run render:hero
```

To use an already installed Chrome, set `HERO_BROWSER_CHANNEL=chrome`. The artwork uses system fonts, so small font differences between operating systems are expected. The renderer writes frames to a temporary directory, encodes each theme using a shared palette, and removes temporary files afterwards. Commit both GIFs with the source artwork when changing the design.
