// Checks data/spots.json before a merge. Run: node data/validate-spots.mjs
import { readFileSync } from 'node:fs';

// Strip a byte-order mark, which some Windows editors add when saving UTF-8.
const raw = readFileSync(new URL('./spots.json', import.meta.url), 'utf8').replace(/^﻿/, '');
const spots = JSON.parse(raw);
const errors = [];
const seen = new Set();
const places = new Map();

// lib/openMeteo.ts fetches every spot in one request, which allows at most 40 locations.
if (spots.length > 40) errors.push(`${spots.length} spots: the forecast request allows at most 40`);

spots.forEach((s, i) => {
  const at = `spot ${i} (${s.id ?? 'no id'})`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id ?? '')) errors.push(`${at}: id must be a lowercase slug`);
  if (seen.has(s.id)) errors.push(`${at}: duplicate id`);
  seen.add(s.id);
  if (typeof s.name !== 'string' || !s.name.trim()) errors.push(`${at}: name is empty`);
  if (!(Math.abs(s.lat) <= 90)) errors.push(`${at}: lat out of range`);
  if (!(Math.abs(s.lon) <= 180)) errors.push(`${at}: lon out of range`);
  if (!Number.isInteger(s.bortle) || s.bortle < 1 || s.bortle > 9) errors.push(`${at}: bortle must be an integer 1-9`);
  if (typeof s.openAtNight !== 'boolean') errors.push(`${at}: openAtNight must be true or false`);
  if (typeof s.notes !== 'string' || !s.notes.trim()) errors.push(`${at}: notes are empty`);
  // Every fact needs a source (see the per-spot checklist).
  if (!(Array.isArray(s.sources) && s.sources.length && s.sources.every(u => /^https?:\/\//.test(u)))) {
    errors.push(`${at}: sources must be a non-empty list of URLs`);
  }
  // Same coordinates twice usually means a copy-paste slip, but it isn't always wrong.
  const place = `${s.lat},${s.lon}`;
  if (places.has(place)) console.warn(`warning: ${at} has the same coordinates as ${places.get(place)}`);
  places.set(place, s.id);
});

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`spots.json OK: ${spots.length} spots`);
