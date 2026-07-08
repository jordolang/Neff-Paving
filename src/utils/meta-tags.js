/**
 * Meta Tags Generation Utility
 * Generates SEO-optimized meta tags for different pages
 */

import { BASE_URL, createUrl } from './base-url.js';

/**
 * Default meta tag configuration
 */
const DEFAULT_META = {
  siteName: 'Neff Paving',
  siteUrl: 'https://neffpaving.co',
  themeColor: '#0e1117',
  tileColor: '#0e1117',
  locale: 'en_US',
  language: 'English',
  author: 'Neff Paving',
  business: {
    phone: '+1-740-453-3063',
    email: 'neffpaving@gmail.com',
    region: 'US',
    placename: 'Zanesville, Ohio'
  }
};

/**
 * Generate primary meta tags
 * @param {object} options - Meta tag options
 * @returns {object} Primary meta tags
 */
export function generatePrimaryMeta(options = {}) {
  const {
    title = 'Neff Paving & Concrete — Built on Quality. Driven by Pride. | Central Ohio Paving',
    description = "Neff Paving & Concrete is Central Ohio's trusted asphalt, concrete & excavation contractor since 1999 — quality driveways, parking lots & concrete work. Licensed, insured & satisfaction guaranteed. Your Road. Our Reputation.",
    keywords = 'paving contractor, driveway paving, parking lot construction, asphalt paving, residential paving, commercial paving, crack sealing, seal coating, concrete contractor, Neff Paving & Concrete',
    robots = 'index, follow'
  } = options;

  return {
    'title': title,
    'name:title': title,
    'name:description': description,
    'name:keywords': keywords,
    'name:robots': robots,
    'name:language': DEFAULT_META.language,
    'name:author': DEFAULT_META.author
  };
}

/**
 * Generate Open Graph meta tags
 * @param {object} options - Open Graph options
 * @returns {object} Open Graph meta tags
 */
export function generateOpenGraphMeta(options = {}) {
  const {
    type = 'website',
    url = DEFAULT_META.siteUrl,
    title = 'Neff Paving & Concrete — Built on Quality. Driven by Pride.',
    description = "Your Road. Our Reputation. Central Ohio's trusted asphalt, concrete & excavation contractor since 1999. Licensed, insured & satisfaction guaranteed.",
    image = '/opengraph-image.png',
    imageWidth = '1200',
    imageHeight = '630',
    siteName = DEFAULT_META.siteName,
    locale = DEFAULT_META.locale
  } = options;

  return {
    'property:og:type': type,
    'property:og:url': url,
    'property:og:title': title,
    'property:og:description': description,
    'property:og:image': image.startsWith('http') ? image : `${DEFAULT_META.siteUrl}${image}`,
    'property:og:image:width': imageWidth,
    'property:og:image:height': imageHeight,
    'property:og:site_name': siteName,
    'property:og:locale': locale
  };
}

/**
 * Generate Twitter Card meta tags
 * @param {object} options - Twitter Card options
 * @returns {object} Twitter Card meta tags
 */
export function generateTwitterMeta(options = {}) {
  const {
    card = 'summary_large_image',
    url = DEFAULT_META.siteUrl,
    title = 'Neff Paving & Concrete — Built on Quality. Driven by Pride.',
    description = "Your Road. Our Reputation. Central Ohio's trusted asphalt, concrete & excavation contractor since 1999.",
    image = '/opengraph-image.png'
  } = options;

  return {
    'property:twitter:card': card,
    'property:twitter:url': url,
    'property:twitter:title': title,
    'property:twitter:description': description,
    'property:twitter:image': image.startsWith('http') ? image : `${DEFAULT_META.siteUrl}${image}`
  };
}

/**
 * Generate local business meta tags
 * @param {object} options - Local business options
 * @returns {object} Local business meta tags
 */
export function generateLocalBusinessMeta(options = {}) {
  const {
    region = DEFAULT_META.business.region,
    placename = DEFAULT_META.business.placename,
    phone = DEFAULT_META.business.phone,
    email = DEFAULT_META.business.email
  } = options;

  return {
    'name:geo.region': region,
    'name:geo.placename': placename,
    'name:business:contact_data:phone_number': phone,
    'name:business:contact_data:email': email
  };
}

/**
 * Generate theme and branding meta tags
 * @param {object} options - Theme options
 * @returns {object} Theme meta tags
 */
export function generateThemeMeta(options = {}) {
  const {
    themeColor = DEFAULT_META.themeColor,
    tileColor = DEFAULT_META.tileColor
  } = options;

  return {
    'name:theme-color': themeColor,
    'name:msapplication-TileColor': tileColor
  };
}

/**
 * Generate canonical URL meta tag
 * @param {string} path - Page path
 * @returns {object} Canonical URL meta tag
 */
export function generateCanonicalMeta(path = '/') {
  const url = path.startsWith('http') ? path : `${DEFAULT_META.siteUrl}${path}`;

  return {
    'link:canonical': url
  };
}

/**
 * Generate complete set of meta tags for a page
 * @param {object} options - Page meta options
 * @returns {object} Complete meta tags object
 */
export function generateMetaTags(options = {}) {
  const {
    // Primary meta
    title,
    description,
    keywords,
    robots,

    // Open Graph
    ogType,
    ogUrl,
    ogTitle,
    ogDescription,
    ogImage,
    ogImageWidth,
    ogImageHeight,

    // Twitter
    twitterCard,
    twitterUrl,
    twitterTitle,
    twitterDescription,
    twitterImage,

    // Local Business
    geoRegion,
    geoPlacename,
    businessPhone,
    businessEmail,

    // Theme
    themeColor,
    tileColor,

    // Canonical
    canonicalPath
  } = options;

  // Generate all meta tag groups
  const primaryMeta = generatePrimaryMeta({ title, description, keywords, robots });
  const ogMeta = generateOpenGraphMeta({
    type: ogType,
    url: ogUrl,
    title: ogTitle || title,
    description: ogDescription || description,
    image: ogImage,
    imageWidth: ogImageWidth,
    imageHeight: ogImageHeight
  });
  const twitterMeta = generateTwitterMeta({
    card: twitterCard,
    url: twitterUrl,
    title: twitterTitle || title,
    description: twitterDescription || description,
    image: twitterImage || ogImage
  });
  const localBusinessMeta = generateLocalBusinessMeta({
    region: geoRegion,
    placename: geoPlacename,
    phone: businessPhone,
    email: businessEmail
  });
  const themeMeta = generateThemeMeta({ themeColor, tileColor });
  const canonicalMeta = generateCanonicalMeta(canonicalPath);

  // Combine all meta tags
  return {
    ...primaryMeta,
    ...ogMeta,
    ...twitterMeta,
    ...localBusinessMeta,
    ...themeMeta,
    ...canonicalMeta
  };
}

/**
 * Apply meta tags to the document
 * @param {object} metaTags - Meta tags object
 */
export function applyMetaTags(metaTags) {
  if (typeof document === 'undefined') return;

  Object.entries(metaTags).forEach(([key, value]) => {
    try {
      const [type, name] = key.split(':');

      if (type === 'title') {
        // Update document title
        document.title = value;
      } else if (type === 'link') {
        // Handle link tags (e.g., canonical)
        let link = document.querySelector(`link[rel="${name}"]`);
        if (!link) {
          link = document.createElement('link');
          link.rel = name;
          document.head.appendChild(link);
        }
        link.href = value;
      } else if (type === 'name') {
        // Handle name-based meta tags
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = name;
          document.head.appendChild(meta);
        }
        meta.content = value;
      } else if (type === 'property') {
        // Handle property-based meta tags (Open Graph, Twitter)
        let meta = document.querySelector(`meta[property="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', name);
          document.head.appendChild(meta);
        }
        meta.content = value;
      }
    } catch (error) {
      console.warn(`Failed to apply meta tag ${key}:`, error);
    }
  });
}

/**
 * Update page meta tags
 * @param {object} options - Page meta options
 */
export function updatePageMeta(options) {
  const metaTags = generateMetaTags(options);
  applyMetaTags(metaTags);
}

/**
 * Generate structured data (JSON-LD) for local business
 * @param {object} options - Business options
 * @returns {object} JSON-LD structured data
 */
export function generateLocalBusinessSchema(options = {}) {
  const {
    name = 'Neff Paving',
    description = 'Professional paving contractor specializing in residential driveways, commercial parking lots, and maintenance services. Your Road. Our Reputation.',
    slogan = 'Built on Quality. Driven by Pride.',
    phone = '+1-740-453-3063',
    email = 'neffpaving@gmail.com',
    address = {
      streetAddress: '6575 W Pike',
      addressLocality: 'Zanesville',
      addressRegion: 'Ohio',
      postalCode: '43701',
      addressCountry: 'US'
    },
    foundingDate = '1999',
    priceRange = '$$'
  } = options;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${DEFAULT_META.siteUrl}/#localbusiness`,
    name,
    description,
    slogan,
    priceRange,
    telephone: phone,
    email,
    url: DEFAULT_META.siteUrl,
    address: {
      '@type': 'PostalAddress',
      ...address
    },
    foundingDate
  };
}

// Export default configuration for external use
export { DEFAULT_META };
