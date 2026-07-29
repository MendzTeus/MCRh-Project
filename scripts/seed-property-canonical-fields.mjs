#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { properties as staticProperties } from '../src/data/properties.ts';

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });

const APPLY = process.argv.includes('--apply');
const FIELDS = ['name', 'area', 'eyebrow', 'neighborhoodTitle', 'description'];
const APPROVED_CORRECTIONS = {
  'old-trafford': {
    description: 'A delightful Old Trafford apartment with two bedrooms, two bathrooms, and free parking — ideal for families and sports visitors.',
  },
};

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !serviceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function sameSlugSet(left, right) {
  return left.length === right.length && left.every((slug, index) => slug === right[index]);
}

const [
  { data: propertyRows, error: propertyError },
  { data: contentRows, error: contentError },
  { data: unitRows, error: unitError },
] = await Promise.all([
  supabase.from('Property').select('*').order('slug'),
  supabase.from('SiteContent').select('key,value').like('key', 'property.%'),
  supabase.from('Unit').select('propertySlug,propertyName'),
]);

if (propertyError) throw propertyError;
if (contentError) throw contentError;
if (unitError) throw unitError;

const databaseSlugs = (propertyRows || []).map((row) => row.slug).sort();
const staticSlugs = staticProperties.map((row) => row.slug).sort();
if (!sameSlugSet(databaseSlugs, staticSlugs)) {
  throw new Error(
    `Property/static slug mismatch.\nProperty: ${databaseSlugs.join(', ')}\nStatic: ${staticSlugs.join(', ')}`,
  );
}

const contentByKey = new Map((contentRows || []).map((row) => [row.key, row.value]));
const staticBySlug = new Map(staticProperties.map((row) => [row.slug, row]));
const unitNamesBySlug = new Map();
for (const row of unitRows || []) {
  const value = nonEmptyString(row.propertyName);
  if (!value) continue;
  const names = unitNamesBySlug.get(row.propertySlug) || new Set();
  names.add(value);
  unitNamesBySlug.set(row.propertySlug, names);
}
for (const [slug, names] of unitNamesBySlug) {
  if (names.size > 1) {
    throw new Error(`Ambiguous Unit.propertyName values for ${slug}: ${[...names].join(', ')}`);
  }
}

const sourceReport = [];
const seededRows = (propertyRows || []).map((current) => {
  const staticRow = staticBySlug.get(current.slug);
  const seeded = { ...current };
  const sources = {};

  for (const field of FIELDS) {
    const siteValue = nonEmptyString(contentByKey.get(`property.${current.slug}.${field}`));
    const staticValue = nonEmptyString(staticRow?.[field]);
    const unitValue = field === 'name'
      ? nonEmptyString([...(unitNamesBySlug.get(current.slug) || [])][0])
      : null;

    if (siteValue !== null) {
      seeded[field] = siteValue;
      sources[field] = 'SiteContent';
    } else if (staticValue !== null) {
      seeded[field] = staticValue;
      sources[field] = 'properties.ts';
    } else if (unitValue !== null) {
      seeded[field] = unitValue;
      sources[field] = 'Unit.propertyName';
    } else {
      seeded[field] = field === 'name' || field === 'description' ? '' : null;
      sources[field] = 'empty';
    }
  }

  const correction = APPROVED_CORRECTIONS[current.slug];
  if (correction) {
    Object.assign(seeded, correction);
    for (const field of Object.keys(correction)) {
      sources[field] = 'approved correction';
    }
  }

  seeded.updatedAt = new Date().toISOString();
  sourceReport.push({ slug: current.slug, sources });
  return seeded;
});

console.log(JSON.stringify({ mode: APPLY ? 'apply' : 'dry-run', buildings: sourceReport }, null, 2));

if (APPLY) {
  const { error } = await supabase
    .from('Property')
    .upsert(seededRows, { onConflict: 'slug' });
  if (error) throw error;
  console.log(`Seeded ${seededRows.length} Property rows.`);
} else {
  console.log('Dry run only. Re-run with --apply to write the seed.');
}
