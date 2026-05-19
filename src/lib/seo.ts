import { useEffect } from 'react';

export const BRAND_NAME = 'SommerVibes';
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://sommervibes.dk').replace(/\/+$/, '');

type SeoType = 'website' | 'article' | 'product';

export interface PageSeo {
  title: string;
  description?: string | null;
  canonicalPath?: string;
  canonicalUrl?: string;
  image?: string | null;
  type?: SeoType;
  robots?: string;
  jsonLd?: unknown;
}

const MANAGED_ATTR = 'data-managed-seo';
const ABSOLUTE_URL_RE = /^[a-z][a-z\d+\-.]*:\/\//i;

export function cleanText(value?: string | null): string {
  return (value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(value: string, maxLength = 155): string {
  if (value.length <= maxLength) return value;
  const trimmed = value.slice(0, maxLength - 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  return `${trimmed.slice(0, lastSpace > 90 ? lastSpace : trimmed.length).trim()}...`;
}

export function absoluteUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (ABSOLUTE_URL_RE.test(value)) return value;
  if (value.startsWith('/')) return `${SITE_URL}${value}`;
  return `${SITE_URL}/${value}`;
}

function getCanonicalUrl(config: PageSeo): string {
  if (config.canonicalUrl) return config.canonicalUrl;
  if (config.canonicalPath) return absoluteUrl(config.canonicalPath) || SITE_URL;
  return window.location.href;
}

export function usePageSeo(config: PageSeo | null): void {
  useEffect(() => {
    if (!config || typeof document === 'undefined') return;

    const previousTitle = document.title;
    const tracked = new Map<HTMLElement, {
      existed: boolean;
      attrs: Record<string, string | null>;
      textContent: string | null;
    }>();

    const track = (element: HTMLElement, existed: boolean) => {
      if (tracked.has(element)) return;
      tracked.set(element, {
        existed,
        attrs: {
          content: element.getAttribute('content'),
          href: element.getAttribute('href'),
          rel: element.getAttribute('rel'),
          id: element.getAttribute('id'),
          type: element.getAttribute('type'),
          [MANAGED_ATTR]: element.getAttribute(MANAGED_ATTR),
        },
        textContent: element.textContent,
      });
    };

    const upsertMeta = (attribute: 'name' | 'property', key: string, content?: string | null) => {
      if (!content) return;
      let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      const existed = Boolean(element);
      if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
      }
      track(element, existed);
      element.setAttribute(attribute, key);
      element.setAttribute('content', content);
      element.setAttribute(MANAGED_ATTR, 'true');
    };

    const upsertCanonical = (href: string) => {
      let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      const existed = Boolean(element);
      if (!element) {
        element = document.createElement('link');
        document.head.appendChild(element);
      }
      track(element, existed);
      element.setAttribute('rel', 'canonical');
      element.setAttribute('href', href);
      element.setAttribute(MANAGED_ATTR, 'true');
    };

    const upsertJsonLd = (jsonLd: unknown) => {
      if (!jsonLd) return;
      let element = document.getElementById('page-json-ld') as HTMLScriptElement | null;
      const existed = Boolean(element);
      if (!element) {
        element = document.createElement('script');
        document.head.appendChild(element);
      }
      track(element, existed);
      element.id = 'page-json-ld';
      element.type = 'application/ld+json';
      element.textContent = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
      element.setAttribute(MANAGED_ATTR, 'true');
    };

    const title = cleanText(config.title);
    const description = truncateText(cleanText(config.description));
    const canonicalUrl = getCanonicalUrl(config);
    const imageUrl = absoluteUrl(config.image);
    const type = config.type || 'website';

    document.title = title;
    upsertCanonical(canonicalUrl);
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', config.robots);
    upsertMeta('property', 'og:site_name', BRAND_NAME);
    upsertMeta('property', 'og:locale', 'da_DK');
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);
    upsertJsonLd(config.jsonLd);

    return () => {
      document.title = previousTitle;
      Array.from(tracked.entries()).reverse().forEach(([element, previous]) => {
        if (!previous.existed) {
          element.remove();
          return;
        }

        Object.entries(previous.attrs).forEach(([name, value]) => {
          if (value === null) {
            element.removeAttribute(name);
          } else {
            element.setAttribute(name, value);
          }
        });
        element.textContent = previous.textContent;
      });
    };
  }, [config]);
}
