#!/usr/bin/env node

import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(
    import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..')
const publicDir = join(projectRoot, 'dist') // Output directory

// Site configuration
const siteConfig = {
    baseUrl: 'https://birkhimer-asphalt.com', // Replace with actual domain
    defaultChangeFreq: 'monthly',
    defaultPriority: '0.7'
}

// Pages configuration
const pages = [{
        url: '/',
        changeFreq: 'weekly',
        priority: '1.0',
        lastMod: new Date().toISOString().split('T')[0]
    },
    {
        url: '/#services',
        changeFreq: 'monthly',
        priority: '0.9',
        lastMod: new Date().toISOString().split('T')[0]
    },
    {
        url: '/#gallery',
        changeFreq: 'weekly',
        priority: '0.8',
        lastMod: new Date().toISOString().split('T')[0]
    },
    {
        url: '/#about',
        changeFreq: 'monthly',
        priority: '0.6',
        lastMod: new Date().toISOString().split('T')[0]
    },
    {
        url: '/#contact',
        changeFreq: 'monthly',
        priority: '0.8',
        lastMod: new Date().toISOString().split('T')[0]
    }
]

async function ensureDir(dirPath) {
    try {
        await mkdir(dirPath, { recursive: true })
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error
        }
    }
}

function generateXMLSitemap(pages) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages.map(page => `  <url>
    <loc>${siteConfig.baseUrl}${page.url}</loc>
    <lastmod>${page.lastMod}</lastmod>
    <changefreq>${page.changeFreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\\n')}
</urlset>`

  return xml
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${siteConfig.baseUrl}/sitemap.xml

# Disallow development and test files
Disallow: /test-results/
Disallow: /playwright-report/
Disallow: /lighthouse-reports/
Disallow: /*.json$
Disallow: /node_modules/

# Allow specific assets
Allow: /assets/
Allow: /images/
Allow: /videos/
Allow: *.css
Allow: *.js

# Crawl delay (optional - remove if not needed)
# Crawl-delay: 1

# Specific instructions for major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /`
}

function generateStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.baseUrl}/#organization`,
        "name": "Neff Paving",
        "url": siteConfig.baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteConfig.baseUrl}/assets/images/logo.png`,
          "width": 300,
          "height": 100
        },
        "description": "Professional paving services for residential and commercial projects. Licensed, insured, and experienced paving contractors.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "123 Main Street", // Replace with actual address
          "addressLocality": "Your City",
          "addressRegion": "Your State", 
          "postalCode": "12345",
          "addressCountry": "US"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1-555-123-7283",
          "contactType": "customer service",
          "availableLanguage": "English",
          "areaServed": "Local Metro Area"
        },
        "sameAs": [
          "https://www.facebook.com/neffpaving", // Add actual social media URLs
          "https://www.linkedin.com/company/neffpaving",
          "https://www.instagram.com/neffpaving"
        ],
        "foundingDate": "1985",
        "numberOfEmployees": "15-25",
        "slogan": "Quality craftsmanship for residential and commercial projects"
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.baseUrl}/#website`,
        "url": siteConfig.baseUrl,
        "name": "Neff Paving - Professional Paving Services",
        "description": "Quality paving solutions for driveways, parking lots, and commercial surfaces. 35+ years of experience.",
        "publisher": {
          "@id": `${siteConfig.baseUrl}/#organization`
        },
        "inLanguage": "en-US"
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteConfig.baseUrl}/#localbusiness`,
        "name": "Neff Paving",
        "image": [
          `${siteConfig.baseUrl}/assets/images/hero-poster-1920x1080.jpg`,
          `${siteConfig.baseUrl}/assets/images/gallery/commercial-parking-1.jpg`,
          `${siteConfig.baseUrl}/assets/images/gallery/residential-driveway-1.jpg`
        ],
        "description": "Professional paving contractor specializing in residential driveways, commercial parking lots, and maintenance services.",
        "priceRange": "$$",
        "telephone": "+1-555-123-7283",
        "email": "info@birkhimer-asphalt.com",
        "url": siteConfig.baseUrl,
        "address": {
          "@type": "PostalAddress", 
          "streetAddress": "123 Main Street",
          "addressLocality": "Your City",
          "addressRegion": "Your State",
          "postalCode": "12345",
          "addressCountry": "US"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "40.7128", // Replace with actual coordinates
          "longitude": "-74.0060"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday", 
              "Wednesday",
              "Thursday",
              "Friday"
            ],
            "opens": "07:00",
            "closes": "19:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Saturday",
            "opens": "08:00",
            "closes": "16:00"
          }
        ],
        "serviceArea": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": "40.7128",
            "longitude": "-74.0060"
          },
          "geoRadius": "50000" // 50km radius
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Paving Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Residential Paving",
                "description": "Driveway installation, walkways, and patio paving for homes"
              }
            },
            {
              "@type": "Offer", 
              "itemOffered": {
                "@type": "Service",
                "name": "Commercial Paving",
                "description": "Parking lot construction and commercial surface paving"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service", 
                "name": "Maintenance Services",
                "description": "Crack sealing, seal coating, and preventive maintenance"
              }
            }
          ]
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "200",
          "bestRating": "5",
          "worstRating": "1"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteConfig.baseUrl}/#breadcrumbs`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": siteConfig.baseUrl
          },
          {
            "@type": "ListItem", 
            "position": 2,
            "name": "Services",
            "item": `${siteConfig.baseUrl}/#services`
          },
          {
            "@type": "ListItem",
            "position": 3, 
            "name": "Gallery",
            "item": `${siteConfig.baseUrl}/#gallery`
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "About",
            "item": `${siteConfig.baseUrl}/#about`
          },
          {
            "@type": "ListItem",
            "position": 5,
            "name": "Contact", 
            "item": `${siteConfig.baseUrl}/#contact`
          }
        ]
      }
    ]
  }

  return JSON.stringify(structuredData, null, 2)
}

async function main() {
  console.log('🗺️  Generating SEO files...')
  
  try {
    // Ensure output directory exists
    await ensureDir(publicDir)
    
    // Generate XML sitemap
    const xmlSitemap = generateXMLSitemap(pages)
    const sitemapPath = join(publicDir, 'sitemap.xml')
    await writeFile(sitemapPath, xmlSitemap, 'utf-8')
    console.log('✅ Generated sitemap.xml')
    
    // Generate robots.txt
    const robotsTxt = generateRobotsTxt()
    const robotsPath = join(publicDir, 'robots.txt')
    await writeFile(robotsPath, robotsTxt, 'utf-8')
    console.log('✅ Generated robots.txt')
    
    // Generate structured data JSON-LD
    const structuredData = generateStructuredData()
    const structuredDataPath = join(publicDir, 'structured-data.json')
    await writeFile(structuredDataPath, structuredData, 'utf-8')
    console.log('✅ Generated structured-data.json')
    
    // Generate meta tags template
    const metaTags = generateMetaTags()
    const metaTagsPath = join(publicDir, 'meta-tags-template.html')
    await writeFile(metaTagsPath, metaTags, 'utf-8')
    console.log('✅ Generated meta-tags-template.html')
    
    console.log('\\n📊 SEO files generated successfully!')
    console.log(`📁 Files saved to: ${publicDir}`)
    console.log('\\n🔧 Next steps:')
    console.log('1. Update baseUrl in siteConfig with your actual domain')
    console.log('2. Replace placeholder addresses and coordinates with real data')
    console.log('3. Add the structured data to your HTML head section')
    console.log('4. Submit sitemap.xml to Google Search Console')
    
  } catch (error) {
    console.error('❌ Error generating SEO files:', error)
    process.exit(1)
  }
}

function generateMetaTags() {
  return `<!-- Primary Meta Tags -->
<title>Neff Paving - Professional Paving Services | Residential & Commercial</title>
<meta name="title" content="Neff Paving - Professional Paving Services | Residential & Commercial">
<meta name="description" content="Expert paving contractors with 35+ years experience. Residential driveways, commercial parking lots, maintenance services. Licensed, insured & satisfaction guaranteed.">
<meta name="keywords" content="paving contractor, driveway paving, parking lot construction, asphalt paving, residential paving, commercial paving, crack sealing, seal coating">
<meta name="robots" content="index, follow">
<meta name="language" content="English">
<meta name="author" content="Neff Paving">

<!-- Viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${siteConfig.baseUrl}/">
<meta property="og:title" content="Neff Paving - Professional Paving Services">
<meta property="og:description" content="Expert paving contractors with 35+ years experience. Residential driveways, commercial parking lots, maintenance services. Licensed, insured & satisfaction guaranteed.">
<meta property="og:image" content="${siteConfig.baseUrl}/assets/images/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Neff Paving">
<meta property="og:locale" content="en_US">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${siteConfig.baseUrl}/">
<meta property="twitter:title" content="Neff Paving - Professional Paving Services">
<meta property="twitter:description" content="Expert paving contractors with 35+ years experience. Residential driveways, commercial parking lots, maintenance services.">
<meta property="twitter:image" content="${siteConfig.baseUrl}/assets/images/twitter-image.jpg">

<!-- Additional Meta Tags -->
<meta name="geo.region" content="US-[STATE]">
<meta name="geo.placename" content="[CITY], [STATE]">
<meta name="geo.position" content="[LATITUDE];[LONGITUDE]">
<meta name="ICBM" content="[LATITUDE], [LONGITUDE]">

<!-- Local Business -->
<meta name="business:contact_data:street_address" content="123 Main Street">
<meta name="business:contact_data:locality" content="[CITY]">
<meta name="business:contact_data:region" content="[STATE]">
<meta name="business:contact_data:postal_code" content="12345">
<meta name="business:contact_data:country_name" content="United States">
<meta name="business:contact_data:phone_number" content="+1-555-123-7283">
<meta name="business:contact_data:email" content="info@birkhimer-asphalt.com">

<!-- Theme Color -->
<meta name="theme-color" content="#2C2C2C">
<meta name="msapplication-TileColor" content="#2C2C2C">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">

<!-- Canonical URL -->
<link rel="canonical" href="${siteConfig.baseUrl}/">

<!-- Preconnect for Performance -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
${generateStructuredData()}
</script>`
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { generateXMLSitemap, generateRobotsTxt, generateStructuredData, generateMetaTags }