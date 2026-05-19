import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputArg = process.argv.find((arg) => !arg.startsWith('--') && arg !== process.argv[0] && arg !== process.argv[1]);
const OUTPUT_DIR = path.resolve(ROOT_DIR, outputArg || 'public');
const SHOULD_PRERENDER = process.argv.includes('--prerender');
const BRAND_NAME = 'SommerVibes';
const DEFAULT_SITE_URL = 'https://sommervibes.dk';
const TODAY = new Date().toISOString().slice(0, 10);

const PUBLIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/listings', priority: '0.9', changefreq: 'daily' },
  { path: '/how-it-works', priority: '0.8', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/kom-i-gang', priority: '0.8', changefreq: 'monthly' },
  { path: '/book-vurdering', priority: '0.7', changefreq: 'monthly' },
  { path: '/beregn-lejeindtaegt', priority: '0.7', changefreq: 'monthly' },
  { path: '/refer-a-host', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/app', priority: '0.4', changefreq: 'monthly' },
];

function parseDotenv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        if (separator === -1) return null;
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
        return [key, value];
      })
      .filter(Boolean),
  );
}

async function loadEnv() {
  const fileEnv = {};
  for (const fileName of ['.env', '.env.local']) {
    try {
      Object.assign(fileEnv, parseDotenv(await fs.readFile(path.join(ROOT_DIR, fileName), 'utf8')));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  return {
    ...fileEnv,
    ...process.env,
  };
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function absoluteUrl(siteUrl, value) {
  if (!value) return undefined;
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${siteUrl}${value}`;
  return `${siteUrl}/${value}`;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength = 155) {
  if (value.length <= maxLength) return value;
  const trimmed = value.slice(0, maxLength - 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  return `${trimmed.slice(0, lastSpace > 90 ? lastSpace : trimmed.length).trim()}...`;
}

function toFileSegment(slug) {
  return slug.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-');
}

function getListingSeo(listing) {
  if (Array.isArray(listing.listing_seo)) return listing.listing_seo[0] || null;
  return listing.listing_seo || null;
}

function buildListingDescription(listing, seo) {
  return truncateText(cleanText(
    seo?.meta_description ||
    listing.seo_description ||
    listing.tagline ||
    listing.description ||
    listing.long_description ||
    `Book ${listing.name} hos ${BRAND_NAME}. Se billeder, faciliteter og pris for dette sommerhus.`,
  ));
}

function buildListingMetadata(siteUrl, listing) {
  const seo = getListingSeo(listing);
  const canonicalPath = `/listing/${encodeURIComponent(listing.slug)}/`;
  const canonicalUrl = seo?.canonical_url || absoluteUrl(siteUrl, canonicalPath);
  const generatedOgImage = absoluteUrl(siteUrl, `/og/listings/${encodeURIComponent(listing.slug)}.png`);
  const title = cleanText(seo?.meta_title || listing.seo_title || `${listing.name} | ${BRAND_NAME}`);
  const description = buildListingDescription(listing, seo);
  const image = absoluteUrl(siteUrl, seo?.og_image || listing.seo_image) || generatedOgImage;

  return {
    title,
    description,
    canonicalUrl,
    generatedOgImage,
    image,
  };
}

function buildListingJsonLd(siteUrl, listing, metadata) {
  const price = Number(((listing.base_price_per_night || 0) / 100).toFixed(2));
  const image = [
    listing.hero_image,
    ...(listing.images || []),
  ]
    .map((value) => absoluteUrl(siteUrl, value))
    .filter(Boolean);

  const additionalProperty = [
    { name: 'Guests', value: listing.max_guests },
    listing.bedrooms ? { name: 'Bedrooms', value: listing.bedrooms } : null,
    listing.bathrooms ? { name: 'Bathrooms', value: listing.bathrooms } : null,
    listing.sqm ? { name: 'Square meters', value: listing.sqm } : null,
    listing.region ? { name: 'Region', value: listing.region } : null,
  ]
    .filter(Boolean)
    .map((property) => ({
      '@type': 'PropertyValue',
      ...property,
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${metadata.canonicalUrl}#product`,
    name: listing.name,
    description: metadata.description,
    url: metadata.canonicalUrl,
    image: image.length ? image : [metadata.image],
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    category: listing.property_type || 'Sommerhus',
    sku: listing.id,
    offers: {
      '@type': 'Offer',
      url: metadata.canonicalUrl,
      price,
      priceCurrency: listing.currency || 'DKK',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price,
        priceCurrency: listing.currency || 'DKK',
        unitText: 'night',
      },
    },
    additionalProperty,
  };
}

async function fetchListings(env) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[generate-seo] Missing Supabase env vars; skipping listing SEO generation.');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('listings')
    .select(`
      id,
      slug,
      name,
      description,
      tagline,
      long_description,
      address,
      region,
      city,
      country,
      max_guests,
      bedrooms,
      bathrooms,
      sqm,
      base_price_per_night,
      currency,
      amenities,
      hero_image,
      images,
      property_type,
      seo_title,
      seo_description,
      seo_image,
      updated_at,
      published_at,
      sort_order,
      listing_seo(meta_title, meta_description, og_image, canonical_url)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function writeRobots(siteUrl) {
  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /owner',
    'Disallow: /guest',
    'Disallow: /auth',
    '',
    `Sitemap: ${absoluteUrl(siteUrl, '/sitemap.xml')}`,
    '',
  ].join('\n');

  await fs.writeFile(path.join(OUTPUT_DIR, 'robots.txt'), content, 'utf8');
}

async function writeSitemap(siteUrl, listings) {
  const staticUrls = PUBLIC_ROUTES.map((route) => ({
    loc: absoluteUrl(siteUrl, route.path),
    lastmod: TODAY,
    changefreq: route.changefreq,
    priority: route.priority,
  }));

  const listingUrls = listings.map((listing) => ({
    loc: absoluteUrl(siteUrl, `/listing/${encodeURIComponent(listing.slug)}/`),
    lastmod: (listing.updated_at || listing.published_at || TODAY).slice(0, 10),
    changefreq: 'weekly',
    priority: '0.8',
  }));

  const body = [...staticUrls, ...listingUrls]
    .map((url) => [
      '  <url>',
      `    <loc>${xmlEscape(url.loc)}</loc>`,
      `    <lastmod>${xmlEscape(url.lastmod)}</lastmod>`,
      `    <changefreq>${url.changefreq}</changefreq>`,
      `    <priority>${url.priority}</priority>`,
      '  </url>',
    ].join('\n'))
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
    '',
  ].join('\n');

  await fs.writeFile(path.join(OUTPUT_DIR, 'sitemap.xml'), xml, 'utf8');
}

function wrapText(value, maxChars, maxLines) {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = next;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]$/, '')}...`;
  }

  return lines;
}

function formatPrice(cents) {
  const value = Math.round((cents || 0) / 100);
  return new Intl.NumberFormat('da-DK').format(value);
}

function buildOgOverlaySvg(listing, metadata) {
  const titleLines = wrapText(listing.name, 29, 3);
  const place = cleanText([listing.region, listing.address].filter(Boolean).join(' - '));
  const detailParts = [
    listing.max_guests ? `Op til ${listing.max_guests} gæster` : null,
    listing.bedrooms ? `${listing.bedrooms} soveværelser` : null,
    listing.bathrooms ? `${listing.bathrooms} bad` : null,
  ].filter(Boolean);
  const price = `Fra ${formatPrice(listing.base_price_per_night)} kr. / nat`;
  const footer = truncateText(metadata.description, 96);

  const titleSvg = titleLines
    .map((line, index) => `<text x="80" y="${330 + index * 64}" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="700" fill="#fffdf7">${htmlEscape(line)}</text>`)
    .join('');

  return Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#06130f" stop-opacity="0.84"/>
          <stop offset="52%" stop-color="#06130f" stop-opacity="0.48"/>
          <stop offset="100%" stop-color="#06130f" stop-opacity="0.20"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#shade)"/>
      <rect x="64" y="64" width="210" height="46" rx="23" fill="#f7c46c"/>
      <text x="88" y="94" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#10231c">${BRAND_NAME}</text>
      ${place ? `<text x="80" y="268" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="600" fill="#f7c46c">${htmlEscape(place)}</text>` : ''}
      ${titleSvg}
      <text x="80" y="544" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="600" fill="#fffdf7">${htmlEscape(detailParts.join(' · '))}</text>
      <rect x="760" y="478" width="360" height="72" rx="36" fill="#fffdf7"/>
      <text x="800" y="524" font-family="Inter, Arial, sans-serif" font-size="29" font-weight="800" fill="#10231c">${htmlEscape(price)}</text>
      <text x="80" y="586" font-family="Inter, Arial, sans-serif" font-size="18" fill="#fffdf7" opacity="0.82">${htmlEscape(footer)}</text>
    </svg>
  `);
}

async function readLocalAsset(value) {
  if (!value?.startsWith('/')) return null;
  const localPath = path.join(OUTPUT_DIR, value.replace(/^\/+/, ''));
  try {
    return await fs.readFile(localPath);
  } catch {
    return null;
  }
}

async function fetchImageBuffer(value) {
  if (!value) return null;
  const localAsset = await readLocalAsset(value);
  if (localAsset) return localAsset;
  if (!/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(value, {
      signal: controller.signal,
      headers: {
        'user-agent': `${BRAND_NAME} SEO image generator`,
      },
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

async function buildOgBaseImage(listing) {
  const source = listing.seo_image || listing.hero_image || listing.images?.[0] || '/og-image.png';
  const sourceBuffer = await fetchImageBuffer(source);
  if (sourceBuffer) {
    try {
      return await sharp(sourceBuffer)
        .resize(1200, 630, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer();
    } catch {
      // Fall through to the generated brand background.
    }
  }

  return sharp(Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#123026"/>
          <stop offset="55%" stop-color="#47644f"/>
          <stop offset="100%" stop-color="#f7c46c"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
    </svg>
  `))
    .png()
    .toBuffer();
}

async function writeListingOgImages(listings, metadataById) {
  const outputDir = path.join(OUTPUT_DIR, 'og', 'listings');
  await fs.mkdir(outputDir, { recursive: true });

  await Promise.all(listings.map(async (listing) => {
    const metadata = metadataById.get(listing.id);
    const baseImage = await buildOgBaseImage(listing);
    const outputPath = path.join(outputDir, `${toFileSegment(listing.slug)}.png`);

    await sharp(baseImage)
      .composite([{ input: buildOgOverlaySvg(listing, metadata) }])
      .png({ quality: 92 })
      .toFile(outputPath);
  }));
}

function createListingHtml(indexHtml, metadata, jsonLd) {
  const tags = [
    `<title>${htmlEscape(metadata.title)}</title>`,
    `<meta name="description" content="${htmlEscape(metadata.description)}" />`,
    '<meta name="robots" content="index, follow" />',
    `<link rel="canonical" href="${htmlEscape(metadata.canonicalUrl)}" />`,
    `<meta property="og:site_name" content="${BRAND_NAME}" />`,
    '<meta property="og:locale" content="da_DK" />',
    '<meta property="og:type" content="product" />',
    `<meta property="og:title" content="${htmlEscape(metadata.title)}" />`,
    `<meta property="og:description" content="${htmlEscape(metadata.description)}" />`,
    `<meta property="og:url" content="${htmlEscape(metadata.canonicalUrl)}" />`,
    `<meta property="og:image" content="${htmlEscape(metadata.image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${htmlEscape(metadata.title)}" />`,
    `<meta name="twitter:description" content="${htmlEscape(metadata.description)}" />`,
    `<meta name="twitter:image" content="${htmlEscape(metadata.image)}" />`,
    `<script type="application/ld+json" data-seo="listing">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ');

  const cleaned = indexHtml
    .replace(/\s*<title>[\s\S]*?<\/title>\s*/i, '\n')
    .replace(/\s*<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '\n')
    .replace(/\s*<link\s+rel="canonical"[^>]*>\s*/gi, '\n')
    .replace(/\s*<script\s+type="application\/ld\+json"[\s\S]*?<\/script>\s*/gi, '\n');

  return cleaned.replace('</head>', `    ${tags}\n  </head>`);
}

async function writePrerenderedListingPages(listings, metadataById, jsonLdById) {
  const indexPath = path.join(OUTPUT_DIR, 'index.html');
  const indexHtml = await fs.readFile(indexPath, 'utf8');

  await Promise.all(listings.map(async (listing) => {
    const metadata = metadataById.get(listing.id);
    const jsonLd = jsonLdById.get(listing.id);
    const html = createListingHtml(indexHtml, metadata, jsonLd);
    const routeDir = path.join(OUTPUT_DIR, 'listing', toFileSegment(listing.slug));
    await fs.mkdir(routeDir, { recursive: true });
    await fs.writeFile(path.join(routeDir, 'index.html'), html, 'utf8');
  }));
}

async function main() {
  const env = await loadEnv();
  const siteUrl = trimTrailingSlash(env.VITE_SITE_URL || env.SITE_URL || DEFAULT_SITE_URL);
  const listings = await fetchListings(env);
  const metadataById = new Map();
  const jsonLdById = new Map();

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  listings.forEach((listing) => {
    const metadata = buildListingMetadata(siteUrl, listing);
    metadataById.set(listing.id, metadata);
    jsonLdById.set(listing.id, buildListingJsonLd(siteUrl, listing, metadata));
  });

  await writeRobots(siteUrl);
  await writeSitemap(siteUrl, listings);
  await writeListingOgImages(listings, metadataById);

  if (SHOULD_PRERENDER) {
    await writePrerenderedListingPages(listings, metadataById, jsonLdById);
  }

  console.log(`Generated SEO assets for ${listings.length} active listing(s) in ${path.relative(ROOT_DIR, OUTPUT_DIR) || '.'}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
