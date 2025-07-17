import { ImageProcessor, processImage, batchProcess, extractMetadata } from './imageProcessor.js';
import path from 'path';

/**
 * Example usage of the ImageProcessor utility
 * This file demonstrates all the features of the image processing system
 */

async function examples() {
  console.log('🖼️  Image Processor Examples\n');

  // Example 1: Basic image processing
  console.log('1. Basic Image Processing');
  console.log('=========================');
  
  const inputImage = 'path/to/your/image.jpg';
  const outputDir = 'path/to/output/directory';
  
  try {
    const result = await processImage(inputImage, outputDir);
    
    if (result.success) {
      console.log('✅ Image processed successfully!');
      console.log(`📊 Original size: ${(result.originalSize / 1024).toFixed(2)} KB`);
      console.log(`💾 Space saved: ${result.totalSaved.percentageSaved}%`);
      console.log(`🖼️  Generated ${result.processedImages.length} variants`);
      
      // Display generated variants
      result.processedImages.forEach(img => {
        console.log(`   - ${img.size} (${img.format}): ${img.width}x${img.height} - ${(img.fileSize / 1024).toFixed(2)} KB`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Example 2: Custom processing options
  console.log('\n2. Custom Processing Options');
  console.log('============================');
  
  const customOptions = {
    sizes: ['thumbnail', 'medium', 'large'], // Only generate specific sizes
    formats: ['webp', 'jpeg'], // Only generate WebP and JPEG
    quality: {
      webp: { quality: 90, effort: 6 },
      jpeg: { quality: 95, progressive: true }
    },
    fit: 'cover', // How to fit images ('cover', 'inside', 'fill')
    withoutEnlargement: true, // Don't upscale small images
    sharpen: true, // Apply sharpening
    background: { r: 255, g: 255, b: 255, alpha: 1 } // Background color for transparent areas
  };
  
  try {
    const result = await processImage(inputImage, outputDir, customOptions);
    console.log('✅ Custom processing completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Example 3: Metadata extraction
  console.log('\n3. Metadata Extraction');
  console.log('======================');
  
  try {
    const metadata = await extractMetadata(inputImage);
    console.log('📋 Image Metadata:');
    console.log(`   📁 Filename: ${metadata.filename}`);
    console.log(`   📐 Dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`   🎨 Format: ${metadata.format}`);
    console.log(`   📊 Size: ${(metadata.size / 1024).toFixed(2)} KB`);
    console.log(`   🔍 Megapixels: ${metadata.megapixels.toFixed(2)} MP`);
    console.log(`   📏 Aspect Ratio: ${metadata.aspectRatio.toFixed(2)}`);
    console.log(`   🌈 Color Space: ${metadata.colorSpace}`);
    console.log(`   ✨ Has Alpha: ${metadata.hasAlpha ? 'Yes' : 'No'}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Example 4: Batch processing
  console.log('\n4. Batch Processing');
  console.log('===================');
  
  const imagePaths = [
    'path/to/image1.jpg',
    'path/to/image2.png',
    'path/to/image3.webp'
  ];
  
  const batchOptions = {
    concurrency: 2, // Process 2 images at a time
    sizes: ['thumbnail', 'medium'],
    formats: ['webp']
  };
  
  try {
    const results = await batchProcess(imagePaths, outputDir, batchOptions);
    
    console.log(`✅ Batch processing completed! Processed ${results.length} images`);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    // Calculate total space saved
    const totalOriginalSize = results.reduce((sum, r) => sum + (r.originalSize || 0), 0);
    const totalProcessedSize = results.reduce((sum, r) => 
      sum + (r.processedImages?.reduce((imgSum, img) => imgSum + img.fileSize, 0) || 0), 0);
    const totalSaved = ((totalOriginalSize - totalProcessedSize) / totalOriginalSize * 100).toFixed(2);
    
    console.log(`   💾 Total space saved: ${totalSaved}%`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Example 5: Using the ImageProcessor class directly
  console.log('\n5. Advanced Usage with ImageProcessor Class');
  console.log('===========================================');
  
  const processor = new ImageProcessor();
  
  try {
    // Get optimal format recommendation
    const optimalFormat = await processor.getOptimalFormat(inputImage);
    console.log(`🎯 Recommended format: ${optimalFormat}`);
    
    // Process with the recommended format
    const result = await processor.processImage(inputImage, outputDir, {
      formats: [optimalFormat, 'jpeg'], // Include fallback
      sizes: ['medium', 'large']
    });
    
    if (result.success) {
      // Generate HTML picture element
      const pictureHtml = processor.generatePictureElement(
        result.srcsets,
        'Example image description',
        {
          className: 'responsive-image',
          loading: 'lazy',
          decoding: 'async'
        }
      );
      
      console.log('🌐 Generated HTML:');
      console.log(pictureHtml);
      
      // Display srcsets information
      console.log('\n📱 Responsive Srcsets:');
      Object.keys(result.srcsets).forEach(format => {
        const srcset = result.srcsets[format];
        console.log(`   ${format.toUpperCase()}:`);
        console.log(`     srcset: ${srcset.srcset}`);
        console.log(`     sizes: ${srcset.sizes}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Example 6: Express.js middleware usage
  console.log('\n6. Express.js Middleware Example');
  console.log('================================');
  
  // This would be used in an actual Express app
  const imageUploadMiddleware = `
// Example Express.js route for image upload and processing
app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, 'public/images/processed');
    
    const result = await processImage(inputPath, outputDir, {
      sizes: ['thumbnail', 'medium', 'large'],
      formats: ['webp', 'jpeg']
    });
    
    if (result.success) {
      // Save metadata to database
      const imageRecord = {
        originalFilename: result.metadata.filename,
        variants: result.processedImages,
        srcsets: result.srcsets,
        metadata: result.metadata
      };
      
      // Store in database...
      
      res.json({
        success: true,
        imageId: 'generated-id',
        variants: result.processedImages,
        srcsets: result.srcsets
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`;
  
  console.log(imageUploadMiddleware);
}

// Export the examples function
export { examples };

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  examples().catch(console.error);
}
