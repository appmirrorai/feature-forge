#!/usr/bin/env node
/**
 * Screenshot Watcher — watches a folder for iOS simulator screenshots
 * and builds a screen flow JSON for the prototype.
 *
 * Usage:
 *   node scripts/screenshot-watcher.mjs /path/to/screenshots
 *   node scripts/screenshot-watcher.mjs /path/to/screenshots --watch
 *
 * Screenshot naming convention:
 *   screen-name.png          → creates a screen called "screen-name"
 *   01-home.png              → ordered: screen 1, name "home"
 *   home--invite.png         → "home" with hotspot linking to "invite"
 *   login_empty-state.png    → "login" in "empty-state" variant
 *
 * Or just drop any .png files and name them after your screens.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'generated', 'screenshots.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'screenshots');

function parseScreenshotName(filename) {
  const name = path.basename(filename, path.extname(filename));

  // Extract order prefix: "01-home" → order: 1, name: "home"
  const orderMatch = name.match(/^(\d+)-(.+)$/);
  const order = orderMatch ? parseInt(orderMatch[1]) : 99;
  const baseName = orderMatch ? orderMatch[2] : name;

  // Extract navigation hint: "home--invite" → from "home", links to "invite"
  const navParts = baseName.split('--');
  const screenName = navParts[0];
  const linksTo = navParts[1] || null;

  // Extract state variant: "login_empty-state" → "login", state: "empty-state"
  const stateParts = screenName.split('_');
  const finalName = stateParts[0];
  const state = stateParts[1] || 'default';

  return { name: finalName, order, linksTo, state, originalFile: filename };
}

function scanScreenshots(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`Error: Directory "${dirPath}" does not exist`);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath).filter(f =>
    /\.(png|jpg|jpeg|webp)$/i.test(f)
  );

  const screens = {};

  for (const file of files) {
    const parsed = parseScreenshotName(file);
    const srcPath = path.join(dirPath, file);

    // Copy to public directory for serving
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    fs.copyFileSync(srcPath, path.join(PUBLIC_DIR, file));

    if (!screens[parsed.name]) {
      screens[parsed.name] = {
        id: parsed.name,
        name: parsed.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        order: parsed.order,
        image: `/screenshots/${file}`,
        states: {},
        hotspots: [],
      };
    }

    // Add state variant
    screens[parsed.name].states[parsed.state] = {
      image: `/screenshots/${file}`,
    };

    // Add navigation link
    if (parsed.linksTo) {
      screens[parsed.name].hotspots.push({
        id: `${parsed.name}-to-${parsed.linksTo}`,
        targetScreen: parsed.linksTo,
        // Default hotspot covers bottom third (likely a button/CTA area)
        x: 10, y: 70, width: 80, height: 15,
        label: `Go to ${parsed.linksTo}`,
      });
    }
  }

  // Sort by order
  const sorted = Object.values(screens).sort((a, b) => a.order - b.order);

  return {
    screens: sorted,
    entryScreen: sorted[0]?.id || null,
    generatedAt: new Date().toISOString(),
    sourceDir: dirPath,
  };
}

// ── Main ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const sourcePath = args.find(a => !a.startsWith('-'));
const watchMode = args.includes('--watch');

if (!sourcePath) {
  console.log('Screenshot Watcher — builds prototype flow from screenshots\n');
  console.log('Usage:');
  console.log('  node scripts/screenshot-watcher.mjs /path/to/screenshots');
  console.log('  node scripts/screenshot-watcher.mjs /path/to/screenshots --watch\n');
  console.log('Naming:');
  console.log('  01-home.png              → screen "home", order 1');
  console.log('  home--invite.png         → "home" links to "invite"');
  console.log('  login_empty-state.png    → "login" empty state variant\n');
  console.log('Output: src/generated/screenshots.json + public/screenshots/');
  process.exit(0);
}

const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function generate() {
  const result = scanScreenshots(sourcePath);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`[Screenshots] Found ${result.screens.length} screens → ${OUTPUT_PATH}`);
  return result;
}

generate();

if (watchMode) {
  console.log(`[Screenshots] Watching ${sourcePath} for changes...\n`);
  let debounce = null;
  fs.watch(sourcePath, (event, filename) => {
    if (filename && /\.(png|jpg|jpeg|webp)$/i.test(filename)) {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        console.log(`[Screenshots] Changed: ${filename}`);
        generate();
      }, 300);
    }
  });
}
