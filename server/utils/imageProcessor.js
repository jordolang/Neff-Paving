import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Configuration for different image sizes
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 },
  xlarge: { width: 1920, height: 1080 }
};

// Quality settings for different formats
const QUALITY_SETTINGS = {
  webp: { quality: 80, effort: 6 },
  jpeg: { quality: 85, progressive: true },
  png: { compressionLevel: 8, adaptiveFiltering: true }
};

class ImageProcessor {
  constructor() {
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'gif'];
  }

  /**
   * Process a single image with all optimizations
   * @param {string} inputPath - Path to the input image
   * @param {string} outputDir - Directory to save processed images
   * @param {Object} options - Processing options
   * @returns {Object} - Processing results with metadata and file paths
   */
  async processImage(inputPath, outputDir, options = {}) {
    try {
      // Validate input
      await this.validateInput(inputPath);
      
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      // Extract original metadata
      const metadata = await this.extractMetadata(inputPath);
      
      // Get base filename without extension
      const baseName = path.basename(inputPath, path.extname(inputPath));
      
      // Process image in multiple sizes and formats
      const processedImages = await this.generateImageVariants(
        inputPath,
        outputDir,
        baseName,
        options
      );
      
      // Generate responsive srcsets
      const srcsets = this.generateSrcsets(processedImages);
      
      return {
        success: true,
        metadata,
        processedImages,
        srcsets,
        originalSize: metadata.size,
        totalSaved: this.calculateSpaceSaved(metadata.size, processedImages)
      };
      
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        success: false,
        error: error.message,
        inputPath
      };
    }
  }

  /**
   * Extract comprehensive metadata from image
   * @param {string} inputPath - Path to the image
   * @returns {Object} - Image metadata
   */
  async extractMetadata(inputPath) {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const stats = await fs.stat(inputPath);
    
    return {
      filename: path.basename(inputPath),
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      colorSpace: metadata.space,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      aspectRatio: metadata.width / metadata.height,
      megapixels: (metadata.width * metadata.height) / 1000000,
      exif: metadata.exif ? await this.parseExif(metadata.exif) : null,
      icc: metadata.icc ? metadata.icc.toString('base64') : null
    };
  }

  /**
   * Generate multiple image variants (sizes and formats)
   * @param {string} inputPath - Path to the input image
   * @param {string} outputDir - Output directory
   * @param {string} baseName - Base filename
   * @param {Object} options - Processing options
   * @returns {Array} - Array of processed image objects
   */
  async generateImageVariants(inputPath, outputDir, baseName, options = {}) {
    const variants = [];
    const sizesToGenerate = options.sizes || Object.keys(IMAGE_SIZES);
    const formatsToGenerate = options.formats || ['webp', 'jpeg'];
    
    // Load the original image
    const originalImage = sharp(inputPath);
    const originalMetadata = await originalImage.metadata();
    
    // Generate variants for each size and format combination
    for (const sizeName of sizesToGenerate) {
      const sizeConfig = IMAGE_SIZES[sizeName];
      if (!sizeConfig) continue;
      
      for (const format of formatsToGenerate) {
        try {
          const variant = await this.createImageVariant(
            originalImage,
            originalMetadata,
            sizeConfig,
            format,
            outputDir,
            baseName,
            sizeName,
            options
          );
          variants.push(variant);
        } catch (error) {
          console.error(`Error creating ${sizeName} ${format} variant:`, error);
        }
      }
    }
    
    return variants;
  }

  /**
   * Create a single image variant
   * @param {Object} originalImage - Sharp image object
   * @param {Object} originalMetadata - Original image metadata
   * @param {Object} sizeConfig - Size configuration
   * @param {string} format - Target format
   * @param {string} outputDir - Output directory
   * @param {string} baseName - Base filename
   * @param {string} sizeName - Size name
   * @param {Object} options - Processing options
   * @returns {Object} - Variant information
   */
  async createImageVariant(originalImage, originalMetadata, sizeConfig, format, outputDir, baseName, sizeName, options) {
    const filename = `${baseName}_${sizeName}.${format}`;
    const outputPath = path.join(outputDir, filename);
    
    // Calculate dimensions preserving aspect ratio
    const dimensions = this.calculateDimensions(
      originalMetadata.width,
      originalMetadata.height,
      sizeConfig.width,
      sizeConfig.height,
      options.fit || 'inside'
    );
    
    // Create processing pipeline
    let pipeline = originalImage.clone()
      .resize(dimensions.width, dimensions.height, {
        fit: options.fit || 'inside',
        withoutEnlargement: options.withoutEnlargement !== false,
        background: options.background || { r: 255, g: 255, b: 255, alpha: 1 }
      });
    
    // Apply format-specific optimizations
    pipeline = this.applyFormatOptimizations(pipeline, format, options);
    
    // Apply additional optimizations
    if (options.sharpen) {
      pipeline = pipeline.sharpen();
    }
    
    if (options.blur) {
      pipeline = pipeline.blur(options.blur);
    }
    
    if (options.gamma) {
      pipeline = pipeline.gamma(options.gamma);
    }
    
    // Write the file
    await pipeline.toFile(outputPath);
    
    // Get file stats
    const stats = await fs.stat(outputPath);
    const metadata = await sharp(outputPath).metadata();
    
    return {
      size: sizeName,
      format,
      filename,
      path: outputPath,
      width: metadata.width,
      height: metadata.height,
      fileSize: stats.size,
      compressionRatio: originalMetadata.size ? (stats.size / originalMetadata.size) : 1,
      url: `/${path.relative(process.cwd(), outputPath)}`.replace(/\\/g, '/')
    };
  }

  /**
   * Apply format-specific optimizations
   * @param {Object} pipeline - Sharp pipeline
   * @param {string} format - Target format
   * @param {Object} options - Processing options
   * @returns {Object} - Optimized pipeline
   */
  applyFormatOptimizations(pipeline, format, options) {
    const qualitySettings = { ...QUALITY_SETTINGS[format], ...options.quality?.[format] };
    
    switch (format) {
      case 'webp':
        return pipeline.webp({
          quality: qualitySettings.quality,
          effort: qualitySettings.effort,
          lossless: options.lossless || false,
          nearLossless: options.nearLossless || false,
          smartSubsample: true,
          reductionEffort: 6
        });
        
      case 'jpeg':
      case 'jpg':
        return pipeline.jpeg({
          quality: qualitySettings.quality,
          progressive: qualitySettings.progressive,
          mozjpeg: true,
          trellisQuantisation: true,
          overshootDeringing: true,
          optimizeScans: true
        });
        
      case 'png':
        return pipeline.png({
          compressionLevel: qualitySettings.compressionLevel,
          adaptiveFiltering: qualitySettings.adaptiveFiltering,
          palette: options.palette || false,
          quality: qualitySettings.quality || 90,
          effort: 10
        });
        
      case 'avif':
        return pipeline.avif({
          quality: qualitySettings.quality || 75,
          effort: 9,
          chromaSubsampling: '4:2:0'
        });
        
      default:
        return pipeline;
    }
  }

  /**
   * Calculate optimal dimensions preserving aspect ratio
   * @param {number} originalWidth - Original width
   * @param {number} originalHeight - Original height
   * @param {number} targetWidth - Target width
   * @param {number} targetHeight - Target height
   * @param {string} fit - Fit strategy
   * @returns {Object} - Calculated dimensions
   */
  calculateDimensions(originalWidth, originalHeight, targetWidth, targetHeight, fit = 'inside') {
    const originalRatio = originalWidth / originalHeight;
    const targetRatio = targetWidth / targetHeight;
    
    let width, height;
    
    switch (fit) {
      case 'cover':
        if (originalRatio > targetRatio) {
          width = targetWidth;
          height = Math.round(targetWidth / originalRatio);
        } else {
          height = targetHeight;
          width = Math.round(targetHeight * originalRatio);
        }
        break;
        
      case 'fill':
        width = targetWidth;
        height = targetHeight;
        break;
        
      case 'inside':
      default:
        if (originalRatio > targetRatio) {
          width = Math.min(targetWidth, originalWidth);
          height = Math.round(width / originalRatio);
        } else {
          height = Math.min(targetHeight, originalHeight);
          width = Math.round(height * originalRatio);
        }
        break;
    }
    
    return { width, height };
  }

  /**
   * Generate responsive image srcsets
   * @param {Array} processedImages - Array of processed images
   * @returns {Object} - Srcsets for different formats
   */
  generateSrcsets(processedImages) {
    const srcsets = {};
    
    // Group by format
    const byFormat = processedImages.reduce((acc, img) => {
      if (!acc[img.format]) acc[img.format] = [];
      acc[img.format].push(img);
      return acc;
    }, {});
    
    // Generate srcsets for each format
    Object.keys(byFormat).forEach(format => {
      const images = byFormat[format].sort((a, b) => a.width - b.width);
      
      srcsets[format] = {
        srcset: images.map(img => `${img.url} ${img.width}w`).join(', '),
        sizes: this.generateSizes(images),
        images: images.map(img => ({
          url: img.url,
          width: img.width,
          height: img.height,
          size: img.size
        }))
      };
    });
    
    return srcsets;
  }

  /**
   * Generate sizes attribute for responsive images
   * @param {Array} images - Array of images
   * @returns {string} - Sizes attribute
   */
  generateSizes(images) {
    const breakpoints = [
      { maxWidth: 480, size: '100vw' },
      { maxWidth: 768, size: '50vw' },
      { maxWidth: 1024, size: '33vw' },
      { maxWidth: 1200, size: '25vw' },
      { maxWidth: Infinity, size: '20vw' }
    ];
    
    return breakpoints
      .map(bp => bp.maxWidth === Infinity ? bp.size : `(max-width: ${bp.maxWidth}px) ${bp.size}`)
      .join(', ');
  }

  /**
   * Parse EXIF data
   * @param {Buffer} exifBuffer - EXIF data buffer
   * @returns {Object} - Parsed EXIF data
   */
  async parseExif(exifBuffer) {
    try {
      // Basic EXIF parsing - in production, you might want to use a library like 'exif-reader'
      return {
        hasExif: true,
        size: exifBuffer.length,
        // Add more EXIF parsing as needed
      };
    } catch (error) {
      return { hasExif: false, error: error.message };
    }
  }

  /**
   * Calculate space saved through optimization
   * @param {number} originalSize - Original file size
   * @param {Array} processedImages - Array of processed images
   * @returns {Object} - Space savings information
   */
  calculateSpaceSaved(originalSize, processedImages) {
    const totalProcessedSize = processedImages.reduce((sum, img) => sum + img.fileSize, 0);
    const spaceSaved = Math.max(0, (originalSize * processedImages.length) - totalProcessedSize);
    const compressionRatio = totalProcessedSize / (originalSize * processedImages.length);
    
    return {
      originalTotalSize: originalSize * processedImages.length,
      processedTotalSize: totalProcessedSize,
      spaceSaved,
      compressionRatio,
      percentageSaved: ((spaceSaved / (originalSize * processedImages.length)) * 100).toFixed(2)
    };
  }

  /**
   * Validate input file
   * @param {string} inputPath - Path to input file
   */
  async validateInput(inputPath) {
    try {
      await fs.access(inputPath);
      const ext = path.extname(inputPath).toLowerCase().substring(1);
      
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported format: ${ext}. Supported formats: ${this.supportedFormats.join(', ')}`);
      }
    } catch (error) {
      throw new Error(`Invalid input file: ${error.message}`);
    }
  }

  /**
   * Batch process multiple images
   * @param {Array} inputPaths - Array of input paths
   * @param {string} outputDir - Output directory
   * @param {Object} options - Processing options
   * @returns {Array} - Array of processing results
   */
  async batchProcess(inputPaths, outputDir, options = {}) {
    const results = [];
    const concurrency = options.concurrency || 3;
    
    // Process images in batches to avoid overwhelming the system
    for (let i = 0; i < inputPaths.length; i += concurrency) {
      const batch = inputPaths.slice(i, i + concurrency);
      const batchPromises = batch.map(inputPath => 
        this.processImage(inputPath, outputDir, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
      ));
    }
    
    return results;
  }

  /**
   * Get optimal format for a given image
   * @param {string} inputPath - Path to input image
   * @returns {string} - Recommended format
   */
  async getOptimalFormat(inputPath) {
    const metadata = await this.extractMetadata(inputPath);
    
    // Simple heuristics for format selection
    if (metadata.hasAlpha) {
      return 'webp'; // WebP handles transparency well
    }
    
    if (metadata.format === 'png' && metadata.channels === 3) {
      return 'jpeg'; // Convert PNG without transparency to JPEG
    }
    
    if (metadata.width * metadata.height > 1000000) {
      return 'webp'; // Use WebP for large images
    }
    
    return 'webp'; // Default to WebP for best compression
  }

  /**
   * Create a picture element HTML with all variants
   * @param {Object} srcsets - Srcsets object
   * @param {string} alt - Alt text
   * @param {Object} options - HTML options
   * @returns {string} - HTML picture element
   */
  generatePictureElement(srcsets, alt = '', options = {}) {
    const { className = '', loading = 'lazy', decoding = 'async' } = options;
    
    let html = '<picture>';
    
    // Add WebP source if available
    if (srcsets.webp) {
      html += `<source srcset="${srcsets.webp.srcset}" sizes="${srcsets.webp.sizes}" type="image/webp">`;
    }
    
    // Add AVIF source if available
    if (srcsets.avif) {
      html += `<source srcset="${srcsets.avif.srcset}" sizes="${srcsets.avif.sizes}" type="image/avif">`;
    }
    
    // Fallback image (usually JPEG)
    const fallbackFormat = srcsets.jpeg || srcsets.jpg || Object.values(srcsets)[0];
    if (fallbackFormat) {
      const fallbackImage = fallbackFormat.images[0];
      html += `<img src="${fallbackImage.url}" `;
      html += `srcset="${fallbackFormat.srcset}" `;
      html += `sizes="${fallbackFormat.sizes}" `;
      html += `alt="${alt}" `;
      html += `loading="${loading}" `;
      html += `decoding="${decoding}" `;
      html += `width="${fallbackImage.width}" `;
      html += `height="${fallbackImage.height}" `;
      if (className) html += `class="${className}" `;
      html += '>';
    }
    
    html += '</picture>';
    
    return html;
  }
}

// Convenience function for quick image processing
export const processImage = async (inputPath, outputDir, options = {}) => {
  const processor = new ImageProcessor();
  return await processor.processImage(inputPath, outputDir, options);
};

// Convenience function for batch processing
export const batchProcess = async (inputPaths, outputDir, options = {}) => {
  const processor = new ImageProcessor();
  return await processor.batchProcess(inputPaths, outputDir, options);
};

// Convenience function for metadata extraction
export const extractMetadata = async (inputPath) => {
  const processor = new ImageProcessor();
  return await processor.extractMetadata(inputPath);
};

// Export the class and configuration
export { ImageProcessor, IMAGE_SIZES, QUALITY_SETTINGS };
