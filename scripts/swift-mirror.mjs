#!/usr/bin/env node
/**
 * Swift Mirror — External SwiftUI → JSON parser
 *
 * Reads .swift files from your iOS repo, parses SwiftUI views,
 * and outputs a JSON prototype schema. Zero changes to iOS project.
 *
 * Usage:
 *   node scripts/swift-mirror.mjs /path/to/ios-app/Sources
 *   node scripts/swift-mirror.mjs /path/to/ios-app/Sources --watch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'generated', 'prototype-schema.json');

// ── SwiftUI Parser ───────────────────────────────────────────────

function parseSwiftFile(content, filename) {
  const screens = {};
  const structRegex = /struct\s+(\w+)\s*:\s*View\s*\{([\s\S]*?)(?=\nstruct\s|\n(?:class|enum|protocol)\s|$)/g;

  let match;
  while ((match = structRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const screen = parseViewBody(body, name);
    if (screen) {
      screens[name] = screen;
    }
  }

  return screens;
}

function parseViewBody(body, viewName) {
  const children = [];

  // NavigationStack / NavigationView
  if (body.includes('NavigationStack') || body.includes('NavigationView')) {
    // Extract .navigationTitle
    const titleMatch = body.match(/\.navigationTitle\("([^"]+)"\)/);
    if (titleMatch) {
      children.push({ type: 'NavBar', title: titleMatch[1] });
      children.push({ type: 'LargeTitle', title: titleMatch[1] });
    }
  }

  // .searchable
  if (body.includes('.searchable')) {
    const searchMatch = body.match(/\.searchable\(text:\s*\$\w+(?:,\s*prompt:\s*"([^"]+)")?\)/);
    children.push({ type: 'SearchBar', placeholder: searchMatch?.[1] || 'Search' });
  }

  // List with Sections — match each Section block carefully
  const sectionRegex = /Section\s*\(\s*"([^"]*)"\s*\)\s*\{([\s\S]*?)(?=\n\s{16}Section|\n\s{12}\}|\n\s{8}\})/g;
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(body)) !== null) {
    const sectionChildren = parseRows(sectionMatch[2]);
    children.push({
      type: 'Section',
      header: sectionMatch[1],
      children: sectionChildren,
    });
  }

  // Standalone List/Form rows (only if no sections were found)
  if (children.filter(c => c.type === 'Section').length === 0) {
    if (body.includes('List') || body.includes('Form')) {
      const rows = parseRows(body);
      if (rows.length > 0) {
        children.push({ type: 'Section', children: rows });
      }
    }
  }

  // Button outside of sections
  const buttonRegex = /Button\s*\(\s*"([^"]+)"\s*\)/g;
  let btnMatch;
  const seenButtons = new Set();
  while ((btnMatch = buttonRegex.exec(body)) !== null) {
    if (!seenButtons.has(btnMatch[1])) {
      seenButtons.add(btnMatch[1]);
      children.push({ type: 'Button', label: btnMatch[1], style: 'filled', full: true });
    }
  }

  // TabView
  if (body.includes('TabView')) {
    const tabItems = parseTabView(body);
    if (tabItems.length > 0) {
      return {
        type: 'Screen',
        children,
        tabBar: { type: 'TabBar', tabs: tabItems, activeIndex: 0 },
      };
    }
  }

  if (children.length === 0) {
    // Fallback — at least create a screen with the name
    children.push({ type: 'NavBar', title: viewName.replace(/View$|Screen$/, '') });
    children.push({ type: 'Spacer', height: 16 });
    children.push({
      type: 'EmptyState',
      icon: '📱',
      title: viewName,
      message: `Parsed from ${viewName}. Add more SwiftUI patterns for richer preview.`,
    });
  }

  return { type: 'Screen', children };
}

function parseRows(content) {
  const rows = [];

  // NavigationLink with label
  const navLinkRegex = /NavigationLink\s*(?:\(\s*"([^"]+)"\s*(?:,\s*(?:destination|value)\s*:\s*(\w+)(?:\(.*?\))?)?\s*\)|\{[\s\S]*?label:\s*\{[\s\S]*?Text\("([^"]+)"\))/g;
  let nlMatch;
  while ((nlMatch = navLinkRegex.exec(content)) !== null) {
    rows.push({ type: 'Row', label: nlMatch[1] || nlMatch[3], chevron: true, navigateTo: nlMatch[2] });
  }

  // Label (icon + text)
  const labelRegex = /Label\s*\(\s*"([^"]+)"\s*,\s*systemImage:\s*"([^"]+)"\s*\)/g;
  let lblMatch;
  while ((lblMatch = labelRegex.exec(content)) !== null) {
    rows.push({ type: 'Row', icon: sfSymbolToEmoji(lblMatch[2]), label: lblMatch[1], chevron: true });
  }

  // Text rows
  const textRegex = /^\s*Text\("([^"]+)"\)/gm;
  let txtMatch;
  while ((txtMatch = textRegex.exec(content)) !== null) {
    rows.push({ type: 'Row', label: txtMatch[1] });
  }

  // Toggle
  const toggleRegex = /Toggle\s*\(\s*"([^"]+)"/g;
  let togMatch;
  while ((togMatch = toggleRegex.exec(content)) !== null) {
    rows.push({ type: 'Row', label: togMatch[1], toggle: true, toggleOn: true });
  }

  // TextField
  const tfRegex = /TextField\s*\(\s*"([^"]+)"/g;
  let tfMatch;
  while ((tfMatch = tfRegex.exec(content)) !== null) {
    rows.push({ type: 'TextField', placeholder: tfMatch[1] });
  }

  // SecureField
  const sfRegex = /SecureField\s*\(\s*"([^"]+)"/g;
  let sfMatch;
  while ((sfMatch = sfRegex.exec(content)) !== null) {
    rows.push({ type: 'TextField', placeholder: sfMatch[1], secure: true });
  }

  return rows;
}

function parseFormFields(content) {
  return parseRows(content);
}

function parseTabView(content) {
  const tabs = [];
  const tabItemRegex = /\.tabItem\s*\{[\s\S]*?(?:Label\("([^"]+)",\s*systemImage:\s*"([^"]+)"\)|Image\(systemName:\s*"([^"]+)"\)[\s\S]*?Text\("([^"]+)"\)|Text\("([^"]+)"\))/g;
  let match;
  while ((match = tabItemRegex.exec(content)) !== null) {
    const label = match[1] || match[4] || match[5] || 'Tab';
    const icon = match[2] || match[3] || 'circle';
    tabs.push({ icon: sfSymbolToEmoji(icon), label });
  }
  return tabs;
}

// Map common SF Symbols to emoji (good enough for prototyping)
function sfSymbolToEmoji(symbol) {
  const map = {
    'house': '🏠', 'house.fill': '🏠',
    'person': '👤', 'person.fill': '👤', 'person.circle': '👤',
    'person.2': '👥', 'person.2.fill': '👥',
    'gear': '⚙️', 'gearshape': '⚙️', 'gearshape.fill': '⚙️',
    'bell': '🔔', 'bell.fill': '🔔',
    'envelope': '✉️', 'envelope.fill': '✉️',
    'message': '💬', 'message.fill': '💬',
    'phone': '📞', 'phone.fill': '📞',
    'camera': '📷', 'camera.fill': '📷',
    'photo': '🖼️', 'photo.fill': '🖼️',
    'heart': '❤️', 'heart.fill': '❤️',
    'star': '⭐', 'star.fill': '⭐',
    'magnifyingglass': '🔍',
    'plus': '➕', 'plus.circle': '➕', 'plus.circle.fill': '➕',
    'trash': '🗑️', 'trash.fill': '🗑️',
    'pencil': '✏️', 'pencil.circle': '✏️',
    'square.and.arrow.up': '📤',
    'square.and.arrow.down': '📥',
    'doc': '📄', 'doc.fill': '📄', 'doc.text': '📄',
    'folder': '📁', 'folder.fill': '📁',
    'calendar': '📅',
    'clock': '🕐', 'clock.fill': '🕐',
    'map': '🗺️', 'mappin': '📍', 'location': '📍', 'location.fill': '📍',
    'wifi': '📶',
    'lock': '🔒', 'lock.fill': '🔒',
    'key': '🔑', 'key.fill': '🔑',
    'cart': '🛒', 'cart.fill': '🛒',
    'creditcard': '💳', 'creditcard.fill': '💳',
    'chart.bar': '📊', 'chart.bar.fill': '📊',
    'list.bullet': '📋',
    'checkmark': '✅', 'checkmark.circle': '✅', 'checkmark.circle.fill': '✅',
    'xmark': '❌', 'xmark.circle': '❌',
    'info.circle': 'ℹ️', 'info.circle.fill': 'ℹ️',
    'exclamationmark.triangle': '⚠️',
    'shield': '🛡️', 'shield.fill': '🛡️',
    'paintbrush': '🎨', 'paintbrush.fill': '🎨',
    'wrench': '🔧', 'wrench.fill': '🔧',
    'bolt': '⚡', 'bolt.fill': '⚡',
    'globe': '🌐',
    'airplane': '✈️',
    'car': '🚗', 'car.fill': '🚗',
  };
  return map[symbol] || '●';
}

// ── File Scanner ─────────────────────────────────────────────────

function scanDirectory(dirPath) {
  const allScreens = {};

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'Pods' && entry.name !== 'build') {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.swift')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes(': View')) {
            const screens = parseSwiftFile(content, entry.name);
            Object.assign(allScreens, screens);
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }
    }
  }

  walk(dirPath);
  return allScreens;
}

function buildSchema(screens, name) {
  const screenNames = Object.keys(screens);
  const entryScreen = screenNames.find(n =>
    n.includes('Home') || n.includes('Main') || n.includes('Root') || n.includes('Content')
  ) || screenNames[0] || 'empty';

  if (screenNames.length === 0) {
    screens['empty'] = {
      type: 'Screen',
      children: [
        { type: 'EmptyState', icon: '📱', title: 'No Views Found', message: 'No SwiftUI views with : View found in the scanned directory.' }
      ]
    };
  }

  return {
    id: `mirror_${Date.now()}`,
    name: name || 'iOS App Mirror',
    screens,
    entryScreen,
  };
}

// ── Main ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const sourcePath = args.find(a => !a.startsWith('-'));
const watchMode = args.includes('--watch');

if (!sourcePath) {
  console.log('Swift Mirror — SwiftUI → JSON prototype generator\n');
  console.log('Usage:');
  console.log('  node scripts/swift-mirror.mjs /path/to/ios-app/Sources');
  console.log('  node scripts/swift-mirror.mjs /path/to/ios-app/Sources --watch\n');
  console.log('Output: src/generated/prototype-schema.json');
  process.exit(0);
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Error: Path "${sourcePath}" does not exist`);
  process.exit(1);
}

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generate() {
  const screens = scanDirectory(sourcePath);
  const count = Object.keys(screens).length;
  const schema = buildSchema(screens, path.basename(sourcePath));
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(schema, null, 2));
  console.log(`[Swift Mirror] Generated ${count} screens → ${OUTPUT_PATH}`);
  return schema;
}

generate();

if (watchMode) {
  console.log(`[Swift Mirror] Watching ${sourcePath} for changes...\n`);
  let debounce = null;

  fs.watch(sourcePath, { recursive: true }, (event, filename) => {
    if (filename && filename.endsWith('.swift')) {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        console.log(`[Swift Mirror] Changed: ${filename}`);
        generate();
      }, 300);
    }
  });
}
