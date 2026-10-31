// Keep motion selection separate from GitHub's theme rewriting of <source media>.
// The static SVG adapts inside the image without animation or scripts.
export function staticHero(artwork) {
  const layers = ['light', 'dark'].map(theme => {
    const content = artwork[theme]
      .replace(/^<svg\b[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g, '')
      .replace(/\bid="([^"]+)"/g, `id="${theme}-$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${theme}-$1)`);
    return `  <g class="theme-${theme}">${content}  </g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 300" role="img" aria-labelledby="title desc" focusable="false">
  <title id="title">Systems / Field Notes</title>
  <desc id="desc">A static systems-console banner with NGINX, Linux, and eBPF labels and an abstract packet trace path.</desc>
  <style>
    .theme-dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .theme-light { display: none; }
      .theme-dark { display: inline; }
    }
  </style>
${layers.join('\n')}
</svg>
`;
}
