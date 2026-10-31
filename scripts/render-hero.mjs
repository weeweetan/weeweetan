import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const fps = 20;
const duration = 6;
const frameCount = fps * duration;

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8' });
  if (result.error) throw new Error('Install FFmpeg and make ffmpeg available on PATH.', { cause: result.error });
  assert.equal(result.status, 0, result.stderr);
}

ffmpeg(['-version']);
const temporary = await mkdtemp(path.join(tmpdir(), 'profile-hero-'));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.HERO_BROWSER_CHANNEL ? { channel: process.env.HERO_BROWSER_CHANNEL } : {}),
});

try {
  for (const theme of ['dark', 'light']) {
    const frames = path.join(temporary, theme);
    await mkdir(frames);
    const svg = await readFile(path.join(root, 'assets', `hero-${theme}.svg`), 'utf8');
    const page = await browser.newPage({ viewport: { width: 960, height: 300 }, deviceScaleFactor: 2 });
    await page.setContent(`<html><body style="margin:0;width:960px;height:300px;overflow:hidden">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);

    // A deterministic SVG overlay: no wall-clock animation or external assets.
    await page.evaluate(({ theme, duration }) => {
      const svg = document.querySelector('svg');
      const route = svg.querySelector('path[stroke-width="5"]');
      if (!route) throw new Error('The source banner must contain its trace route.');
      const length = route.getTotalLength();
      const accent = theme === 'dark' ? '#58e4c2' : '#087f70';
      const core = theme === 'dark' ? '#eafff8' : '#125e87';
      const layer = document.createElementNS(svg.namespaceURI, 'g');
      svg.append(layer);
      const circle = (attributes) => {
        const node = document.createElementNS(svg.namespaceURI, 'circle');
        for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
        layer.append(node);
        return node;
      };
      const nodes = [...svg.querySelectorAll('circle[r="5"]')].map(node => ({
        x: Number(node.getAttribute('cx')),
        y: Number(node.getAttribute('cy')),
        ring: circle({ cx: node.getAttribute('cx'), cy: node.getAttribute('cy'), r: 7, fill: 'none', stroke: accent, 'stroke-width': 1.6, opacity: 0 }),
      }));
      const packets = Array.from({ length: 2 }, () => ({
        trail: Array.from({ length: 5 }, (_, i) => circle({ r: 3.8 - i * .45, fill: accent, opacity: 0 })),
        core: circle({ r: 1.8, fill: core, opacity: 0 }),
      }));
      const status = circle({ cx: 886, cy: 81, r: 6, fill: 'none', stroke: accent, 'stroke-width': 1, opacity: 0 });

      window.renderFrame = time => {
        // Fade to the unchanged SVG at the loop seam and in the first frame.
        const envelope = Math.min(1, time / .4, (duration - time) / .4);
        const heads = packets.map((packet, index) => {
          const progress = ((time / duration) + index / packets.length) % 1;
          const fade = envelope * Math.min(1, progress / .045, (1 - progress) / .045);
          const distance = progress * length;
          const head = route.getPointAtLength(distance);
          packet.trail.forEach((dot, i) => {
            const behind = distance - i * 6;
            const point = route.getPointAtLength(Math.max(0, behind));
            dot.setAttribute('cx', point.x);
            dot.setAttribute('cy', point.y);
            dot.setAttribute('opacity', behind < 0 ? 0 : fade * (1 - i * .17));
          });
          packet.core.setAttribute('cx', head.x);
          packet.core.setAttribute('cy', head.y);
          packet.core.setAttribute('opacity', fade);
          return { x: head.x, y: head.y, fade };
        });
        for (const node of nodes) {
          const pulse = Math.max(...heads.map(head => head.fade * Math.exp(-((head.x - node.x) ** 2 + (head.y - node.y) ** 2) / 190)));
          node.ring.setAttribute('r', 6 + 3 * pulse);
          node.ring.setAttribute('opacity', pulse * .65);
        }
        status.setAttribute('opacity', envelope * (.18 + .2 * Math.sin(time * Math.PI / 3) ** 2));
      };
    }, { theme, duration });

    for (let frame = 0; frame < frameCount; frame++) {
      await page.evaluate(time => window.renderFrame(time), frame / fps);
      await page.screenshot({ path: path.join(frames, `${String(frame).padStart(4, '0')}.png`), animations: 'disabled' });
    }
    await page.close();

    const output = path.join(temporary, `hero-${theme}.gif`);
    ffmpeg([
      '-y', '-framerate', String(fps), '-i', path.join(frames, '%04d.png'),
      '-filter_complex', '[0:v]split[frames][colors];[colors]palettegen=stats_mode=full[palette];[frames][palette]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
      '-loop', '0', '-final_delay', String(100 / fps), output,
    ]);
    const { size } = await stat(output);
    assert.ok(size < 2 * 1024 * 1024, `Banner exceeds the 2 MiB budget: ${theme}`);
    console.log(`${theme}: ${frameCount} frames, ${duration}s, ${(size / 1024).toFixed(0)} KiB`);
  }

  for (const theme of ['dark', 'light']) {
    await copyFile(path.join(temporary, `hero-${theme}.gif`), path.join(root, 'assets', `hero-${theme}.gif`));
  }
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
