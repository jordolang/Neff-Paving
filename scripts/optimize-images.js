#!/usr/bin/env node

import sharp from 'sharp'
import { readdir, stat, mkdir } from 'fs/promises'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..')
const assetsDir = join(projectRoot, 'assets', 'images')
const outputDir = join(projectRoot, 'assets', 'images', 'optimized')

// Optimization settings
const settings = {
  // JPEG optimization
  jpeg: {
    quality: 85,
    mozjpeg: true,
    progressive: true
  },
  // PNG optimization
  png: {
    quality: 90,
    effort: 10,
    compressionLevel: 9
  },
  // WebP conversion
  webp: {
    quality: 85,
    effort: 6,
    lossless: false
  },
  // AVIF conversion (next-gen format)
  avif: {
    quality: 80,
    effort: 9
  },
  // Responsive image sizes
  sizes: [
    { suffix: '-mobile', width: 480 },
    { suffix: '-tablet', width: 768 },
    { suffix: '-desktop', width: 1200 },
    { suffix: '-large', width: 1920 }
  ]
}

async function ensureDir(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

async function getImageFiles(dir) {
  const files = []
  
  try {
    const entries = await readdir(dir)
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stats = await stat(fullPath)
      
      if (stats.isDirectory() && entry !== 'optimized') {
        // Recursively get files from subdirectories
        const subFiles = await getImageFiles(fullPath)
        files.push(...subFiles)
      } else if (stats.isFile()) {
        const ext = extname(entry).toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'].includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message)
  }
  
  return files
}

async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const image = sharp(inputPath)
    const metadata = await image.metadata()
    
    console.log(`Processing: ${basename(inputPath)} (${metadata.width}x${metadata.height})`)
    
    // Apply optimization based on format
    let pipeline = image
    
    if (options.resize) {
      pipeline = pipeline.resize(options.resize.width, options.resize.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
    }
    
    if (options.format) {
      switch (options.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg(settings.jpeg)
          break
        case 'png':
          pipeline = pipeline.png(settings.png)
          break
        case 'webp':
          pipeline = pipeline.webp(settings.webp)
          break
        case 'avif':
          pipeline = pipeline.avif(settings.avif)
          break
      }
    } else {
      // Keep original format but optimize
      switch (metadata.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg(settings.jpeg)
          break
        case 'png':
          pipeline = pipeline.png(settings.png)
          break
        case 'webp':
          pipeline = pipeline.webp(settings.webp)
          break
      }
    }
    
    await pipeline.toFile(outputPath)
    
    // Get file sizes for comparison
    const originalStats = await stat(inputPath)
    const optimizedStats = await stat(outputPath)
    const savings = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(1)
    
    console.log(`  → ${basename(outputPath)} (${(optimizedStats.size / 1024).toFixed(1)}KB, ${savings}% smaller)`)
    
    return {
      original: originalStats.size,
      optimized: optimizedStats.size,
      savings: parseFloat(savings)
    }
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error.message)
    return null
  }
}

async function generateResponsiveImages(inputPath, baseOutputPath) {
  const results = []
  const ext = extname(baseOutputPath)
  const nameWithoutExt = basename(baseOutputPath, ext)
  const dir = dirname(baseOutputPath)
  
  // Generate different sizes
  for (const size of settings.sizes) {
    const outputPath = join(dir, `${nameWithoutExt}${size.suffix}${ext}`)
    const result = await optimizeImage(inputPath, outputPath, {
      resize: { width: size.width }
    })
    if (result) results.push(result)
  }
  
  // Generate WebP versions
  for (const size of settings.sizes) {
    const outputPath = join(dir, `${nameWithoutExt}${size.suffix}.webp`)
    const result = await optimizeImage(inputPath, outputPath, {
      resize: { width: size.width },
      format: 'webp'
    })
    if (result) results.push(result)
  }
  
  // Generate AVIF versions for hero images
  if (inputPath.includes('hero') || inputPath.includes('poster')) {
    for (const size of settings.sizes) {
      const outputPath = join(dir, `${nameWithoutExt}${size.suffix}.avif`)
      const result = await optimizeImage(inputPath, outputPath, {
        resize: { width: size.width },
        format: 'avif'
      })
      if (result) results.push(result)
    }
  }
  
  return results
}

async function generatePictureElement(imageName, alt, className = '') {
  const nameWithoutExt = imageName.replace(/\.[^/.]+$/, '')
  
  return `
<picture${className ? ` class="${className}"` : ''}>
  <!-- AVIF for modern browsers -->
  <source 
    srcset="
      /assets/images/optimized/${nameWithoutExt}-mobile.avif 480w,
      /assets/images/optimized/${nameWithoutExt}-tablet.avif 768w,
      /assets/images/optimized/${nameWithoutExt}-desktop.avif 1200w,
      /assets/images/optimized/${nameWithoutExt}-large.avif 1920w
    "
    sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, (max-width: 1200px) 1200px, 1920px"
    type="image/avif"
  />
  
  <!-- WebP for better compression -->
  <source 
    srcset="
      /assets/images/optimized/${nameWithoutExt}-mobile.webp 480w,
      /assets/images/optimized/${nameWithoutExt}-tablet.webp 768w,
      /assets/images/optimized/${nameWithoutExt}-desktop.webp 1200w,
      /assets/images/optimized/${nameWithoutExt}-large.webp 1920w
    "
    sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, (max-width: 1200px) 1200px, 1920px"
    type="image/webp"
  />
  
  <!-- Fallback JPEG -->
  <img 
    src="/assets/images/optimized/${nameWithoutExt}-desktop.jpg"
    srcset="
      /assets/images/optimized/${nameWithoutExt}-mobile.jpg 480w,
      /assets/images/optimized/${nameWithoutExt}-tablet.jpg 768w,
      /assets/images/optimized/${nameWithoutExt}-desktop.jpg 1200w,
      /assets/images/optimized/${nameWithoutExt}-large.jpg 1920w
    "
    sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, (max-width: 1200px) 1200px, 1920px"
    alt="${alt}"
    loading="lazy"
    decoding="async"
  />
</picture>`.trim()
}

async function main() {
  console.log('🖼️  Starting image optimization...')
  
  try {
    // Ensure output directory exists
    await ensureDir(outputDir)
    
    // Get all image files
    const imageFiles = await getImageFiles(assetsDir)
    
    if (imageFiles.length === 0) {
      console.log('No images found to optimize.')
      return
    }
    
    console.log(`Found ${imageFiles.length} images to optimize`)
    
    let totalSavings = 0
    let totalOriginal = 0
    let totalOptimized = 0
    
    // Process each image
    for (const imagePath of imageFiles) {
      const relativePath = imagePath.replace(assetsDir + '/', '')
      const outputPath = join(outputDir, relativePath)
      const outputSubDir = dirname(outputPath)
      
      // Ensure subdirectory exists
      await ensureDir(outputSubDir)
      
      // Generate responsive images
      const results = await generateResponsiveImages(imagePath, outputPath)
      
      // Calculate totals
      for (const result of results) {
        totalOriginal += result.original
        totalOptimized += result.optimized
      }
    }
    
    totalSavings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1)
    
    console.log('\\n✅ Image optimization complete!')
    console.log(`📊 Total savings: ${totalSavings}%`)
    console.log(`📉 Original size: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`)
    console.log(`📈 Optimized size: ${(totalOptimized / 1024 / 1024).toFixed(2)}MB`)
    
    // Generate sample picture elements
    console.log('\\n📋 Sample responsive image markup:')
    console.log(await generatePictureElement('hero-poster-1920x1080.jpg', 'Hero image', 'hero-image'))
    
  } catch (error) {
    console.error('❌ Error during optimization:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { optimizeImage, generateResponsiveImages, generatePictureElement }
