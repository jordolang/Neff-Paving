# Image Processor Utility

A comprehensive image processing utility built with Sharp library for optimizing, resizing, converting, and managing images with modern web performance in mind.

## Features

✨ **Auto-resize images** to multiple predefined sizes (thumbnail, small, medium, large, xlarge)  
🚀 **WebP conversion** for better performance and smaller file sizes  
📱 **Responsive image srcsets** generation for different screen sizes  
🗜️ **Advanced compression** while maintaining visual quality  
📊 **Metadata extraction** and storage  
🔄 **Batch processing** with configurable concurrency  
🎨 **Format optimization** with intelligent format selection  
🌐 **HTML generation** for responsive picture elements  

## Installation

The utility requires the Sharp library, which should already be installed:

```bash
npm install sharp
```

## Quick Start

```javascript
const { processImage } = require('./server/utils/imageProcessor');

// Basic usage
const result = await processImage('input.jpg', 'output/directory/');

if (result.success) {
  console.log(`Generated ${result.processedImages.length} optimized variants!`);
  console.log(`Space saved: ${result.totalSaved.percentageSaved}%`);
}
```

## API Reference

### Main Classes and Functions

#### `ImageProcessor` Class

The main class providing all image processing functionality.

```javascript
const { ImageProcessor } = require('./server/utils/imageProcessor');
const processor = new ImageProcessor();
```

#### Convenience Functions

- `processImage(inputPath, outputDir, options)` - Process a single image
- `batchProcess(inputPaths, outputDir, options)` - Process multiple images
- `extractMetadata(inputPath)` - Extract image metadata only

### Configuration

#### `IMAGE_SIZES`

Predefined size configurations:

```javascript
{
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 },
  xlarge: { width: 1920, height: 1080 }
}
```

#### `QUALITY_SETTINGS`

Default quality settings for different formats:

```javascript
{
  webp: { quality: 80, effort: 6 },
  jpeg: { quality: 85, progressive: true },
  png: { compressionLevel: 8, adaptiveFiltering: true }
}
```

## Usage Examples

### 1. Basic Image Processing

```javascript
const { processImage } = require('./server/utils/imageProcessor');

const result = await processImage(
  'uploads/photo.jpg',
  'public/images/processed/'
);

console.log(result);
// {
//   success: true,
//   metadata: { width: 2000, height: 1500, format: 'jpeg', ... },
//   processedImages: [
//     { size: 'thumbnail', format: 'webp', width: 150, height: 113, ... },
//     { size: 'thumbnail', format: 'jpeg', width: 150, height: 113, ... },
//     // ... more variants
//   ],
//   srcsets: {
//     webp: { srcset: '...', sizes: '...', images: [...] },
//     jpeg: { srcset: '...', sizes: '...', images: [...] }
//   }
// }
```

### 2. Custom Processing Options

```javascript
const options = {
  sizes: ['thumbnail', 'medium', 'large'],     // Only specific sizes
  formats: ['webp', 'jpeg'],                   // Only WebP and JPEG
  quality: {
    webp: { quality: 90, effort: 6 },
    jpeg: { quality: 95, progressive: true }
  },
  fit: 'cover',                                // 'cover', 'inside', 'fill'
  withoutEnlargement: true,                    // Don't upscale small images
  sharpen: true,                               // Apply sharpening
  background: { r: 255, g: 255, b: 255, alpha: 1 }  // Background for transparent areas
};

const result = await processImage('input.jpg', 'output/', options);
```

### 3. Metadata Extraction

```javascript
const { extractMetadata } = require('./server/utils/imageProcessor');

const metadata = await extractMetadata('photo.jpg');
console.log(metadata);
// {
//   filename: 'photo.jpg',
//   format: 'jpeg',
//   width: 2000,
//   height: 1500,
//   size: 450000,
//   aspectRatio: 1.33,
//   megapixels: 3.0,
//   hasAlpha: false,
//   colorSpace: 'srgb',
//   created: '2024-01-01T00:00:00.000Z',
//   modified: '2024-01-01T00:00:00.000Z'
// }
```

### 4. Batch Processing

```javascript
const { batchProcess } = require('./server/utils/imageProcessor');

const imagePaths = ['img1.jpg', 'img2.png', 'img3.webp'];
const options = {
  concurrency: 3,                    // Process 3 images simultaneously
  sizes: ['thumbnail', 'medium'],
  formats: ['webp']
};

const results = await batchProcess(imagePaths, 'output/', options);

const successful = results.filter(r => r.success).length;
console.log(`Successfully processed ${successful}/${results.length} images`);
```

### 5. Advanced Usage with HTML Generation

```javascript
const { ImageProcessor } = require('./server/utils/imageProcessor');
const processor = new ImageProcessor();

// Process image
const result = await processor.processImage('hero.jpg', 'public/images/');

// Generate responsive HTML
const html = processor.generatePictureElement(
  result.srcsets,
  'Hero image description',
  {
    className: 'hero-image',
    loading: 'lazy',
    decoding: 'async'
  }
);

console.log(html);
// <picture>
//   <source srcset="hero_thumbnail.webp 150w, hero_medium.webp 800w, ..." sizes="..." type="image/webp">
//   <img src="hero_thumbnail.jpeg" srcset="..." alt="Hero image description" loading="lazy" ...>
// </picture>
```

### 6. Express.js Integration

```javascript
const express = require('express');
const multer = require('multer');
const { processImage } = require('./server/utils/imageProcessor');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const result = await processImage(
      req.file.path,
      'public/images/processed/',
      {
        sizes: ['thumbnail', 'medium', 'large'],
        formats: ['webp', 'jpeg']
      }
    );

    if (result.success) {
      res.json({
        success: true,
        variants: result.processedImages,
        srcsets: result.srcsets,
        metadata: result.metadata
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Method Reference

### `processImage(inputPath, outputDir, options = {})`

Process a single image with all optimizations.

**Parameters:**
- `inputPath` (string): Path to the input image
- `outputDir` (string): Directory to save processed images
- `options` (object): Processing options

**Options:**
- `sizes` (array): Size names to generate (default: all sizes)
- `formats` (array): Formats to generate (default: ['webp', 'jpeg'])
- `quality` (object): Quality settings per format
- `fit` (string): How to fit images ('cover', 'inside', 'fill')
- `withoutEnlargement` (boolean): Prevent upscaling (default: true)
- `sharpen` (boolean): Apply sharpening
- `blur` (number): Apply blur (sigma value)
- `gamma` (number): Apply gamma correction
- `background` (object): Background color for transparent areas
- `concurrency` (number): Batch processing concurrency

**Returns:** Promise resolving to processing result object.

### `extractMetadata(inputPath)`

Extract comprehensive metadata from an image.

**Parameters:**
- `inputPath` (string): Path to the image

**Returns:** Promise resolving to metadata object.

### `batchProcess(inputPaths, outputDir, options = {})`

Process multiple images in batches.

**Parameters:**
- `inputPaths` (array): Array of input image paths
- `outputDir` (string): Output directory
- `options` (object): Processing options (same as processImage)

**Returns:** Promise resolving to array of processing results.

### `generateSrcsets(processedImages)`

Generate responsive image srcsets from processed images.

**Parameters:**
- `processedImages` (array): Array of processed image objects

**Returns:** Object containing srcsets for each format.

### `generatePictureElement(srcsets, alt, options = {})`

Generate HTML picture element with all variants.

**Parameters:**
- `srcsets` (object): Srcsets object from processing result
- `alt` (string): Alt text for the image
- `options` (object): HTML options (className, loading, decoding)

**Returns:** HTML string for responsive picture element.

## Supported Formats

**Input formats:** JPEG, PNG, WebP, TIFF, GIF  
**Output formats:** WebP, JPEG, PNG, AVIF

## Performance Tips

1. **Use WebP as primary format** - Provides best compression and quality balance
2. **Enable progressive JPEG** - For better perceived loading performance
3. **Limit concurrent processing** - Use appropriate concurrency levels for your server
4. **Cache processed images** - Avoid reprocessing the same images
5. **Use appropriate quality settings** - Balance file size and visual quality

## Error Handling

The utility provides comprehensive error handling:

```javascript
const result = await processImage('invalid.jpg', 'output/');

if (!result.success) {
  console.error('Processing failed:', result.error);
  // Handle error appropriately
}
```

## File Structure

After processing, your output directory will contain:

```
output/
├── image_thumbnail.webp
├── image_thumbnail.jpeg
├── image_small.webp
├── image_small.jpeg
├── image_medium.webp
├── image_medium.jpeg
├── image_large.webp
├── image_large.jpeg
├── image_xlarge.webp
└── image_xlarge.jpeg
```

## Dependencies

- **Sharp** - High-performance image processing library
- **Node.js fs/promises** - File system operations
- **Node.js path** - Path utilities

## Browser Support

Generated images and srcsets work with:
- **WebP**: Chrome, Firefox, Safari 14+, Edge
- **AVIF**: Chrome 85+, Firefox 93+
- **JPEG/PNG**: All browsers (fallback)

The HTML picture elements provide automatic format selection based on browser support.

## License

This utility is part of the Neff Paving project and follows the same license terms.
