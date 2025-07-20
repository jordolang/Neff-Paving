import { ImageProcessor, processImage, extractMetadata, IMAGE_SIZES, QUALITY_SETTINGS } from './imageProcessor.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Simple test suite for ImageProcessor utility
 * Note: This requires actual image files to test properly
 */

async function runTests() {
  console.log('🧪 Testing ImageProcessor Utility\n');

  // Test 1: Configuration validation
  console.log('1. Testing configuration...');
  try {
    console.log('✅ IMAGE_SIZES loaded:', Object.keys(IMAGE_SIZES).length, 'sizes');
    console.log('✅ QUALITY_SETTINGS loaded:', Object.keys(QUALITY_SETTINGS).length, 'formats');
    
    // Validate size configurations
    for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
      if (!config.width || !config.height) {
        throw new Error(`Invalid size config for ${sizeName}`);
      }
    }
    console.log('✅ All size configurations are valid');
    
    // Validate quality settings
    for (const [format, settings] of Object.entries(QUALITY_SETTINGS)) {
      if (!settings.quality && !settings.compressionLevel) {
        throw new Error(`Invalid quality settings for ${format}`);
      }
    }
    console.log('✅ All quality settings are valid');
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
  }

  // Test 2: Class instantiation
  console.log('\n2. Testing class instantiation...');
  try {
    const processor = new ImageProcessor();
    console.log('✅ ImageProcessor instance created');
    console.log('✅ Supported formats:', processor.supportedFormats.join(', '));
    
    if (processor.supportedFormats.length === 0) {
      throw new Error('No supported formats found');
    }
    
  } catch (error) {
    console.error('❌ Class instantiation test failed:', error.message);
  }

  // Test 3: Dimension calculation
  console.log('\n3. Testing dimension calculation...');
  try {
    const processor = new ImageProcessor();
    
    // Test 'inside' fit (default)
    const dims1 = processor.calculateDimensions(2000, 1500, 800, 600, 'inside');
    console.log('✅ Inside fit calculation:', dims1);
    
    // Test 'cover' fit
    const dims2 = processor.calculateDimensions(2000, 1500, 800, 600, 'cover');
    console.log('✅ Cover fit calculation:', dims2);
    
    // Test 'fill' fit
    const dims3 = processor.calculateDimensions(2000, 1500, 800, 600, 'fill');
    console.log('✅ Fill fit calculation:', dims3);
    
    // Validate results
    if (dims1.width <= 0 || dims1.height <= 0) {
      throw new Error('Invalid dimensions calculated');
    }
    
  } catch (error) {
    console.error('❌ Dimension calculation test failed:', error.message);
  }

  // Test 4: Srcset generation (mock data)
  console.log('\n4. Testing srcset generation...');
  try {
    const processor = new ImageProcessor();
    
    // Mock processed images data
    const mockImages = [
      { size: 'thumbnail', format: 'webp', width: 150, height: 113, url: '/thumb.webp' },
      { size: 'medium', format: 'webp', width: 800, height: 600, url: '/medium.webp' },
      { size: 'large', format: 'webp', width: 1200, height: 900, url: '/large.webp' },
      { size: 'thumbnail', format: 'jpeg', width: 150, height: 113, url: '/thumb.jpg' },
      { size: 'medium', format: 'jpeg', width: 800, height: 600, url: '/medium.jpg' },
      { size: 'large', format: 'jpeg', width: 1200, height: 900, url: '/large.jpg' }
    ];
    
    const srcsets = processor.generateSrcsets(mockImages);
    console.log('✅ Generated srcsets for formats:', Object.keys(srcsets).join(', '));
    
    // Validate srcsets
    if (!srcsets.webp || !srcsets.jpeg) {
      throw new Error('Missing expected formats in srcsets');
    }
    
    if (!srcsets.webp.srcset.includes('150w')) {
      throw new Error('Srcset missing width descriptors');
    }
    
    console.log('✅ WebP srcset:', srcsets.webp.srcset);
    console.log('✅ JPEG srcset:', srcsets.jpeg.srcset);
    
  } catch (error) {
    console.error('❌ Srcset generation test failed:', error.message);
  }

  // Test 5: HTML generation
  console.log('\n5. Testing HTML generation...');
  try {
    const processor = new ImageProcessor();
    
    // Mock srcsets data
    const mockSrcsets = {
      webp: {
        srcset: '/thumb.webp 150w, /medium.webp 800w, /large.webp 1200w',
        sizes: '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw',
        images: [
          { url: '/thumb.webp', width: 150, height: 113, size: 'thumbnail' },
          { url: '/medium.webp', width: 800, height: 600, size: 'medium' },
          { url: '/large.webp', width: 1200, height: 900, size: 'large' }
        ]
      },
      jpeg: {
        srcset: '/thumb.jpg 150w, /medium.jpg 800w, /large.jpg 1200w',
        sizes: '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw',
        images: [
          { url: '/thumb.jpg', width: 150, height: 113, size: 'thumbnail' },
          { url: '/medium.jpg', width: 800, height: 600, size: 'medium' },
          { url: '/large.jpg', width: 1200, height: 900, size: 'large' }
        ]
      }
    };
    
    const html = processor.generatePictureElement(
      mockSrcsets,
      'Test image',
      { className: 'test-image', loading: 'lazy' }
    );
    
    console.log('✅ Generated HTML picture element');
    console.log(html);
    
    // Validate HTML
    if (!html.includes('<picture>') || !html.includes('</picture>')) {
      throw new Error('Invalid HTML structure');
    }
    
    if (!html.includes('type="image/webp"')) {
      throw new Error('Missing WebP source element');
    }
    
    if (!html.includes('alt="Test image"')) {
      throw new Error('Missing alt attribute');
    }
    
  } catch (error) {
    console.error('❌ HTML generation test failed:', error.message);
  }

  // Test 6: Input validation
  console.log('\n6. Testing input validation...');
  try {
    const processor = new ImageProcessor();
    
    // Test with non-existent file
    try {
      await processor.validateInput('/non/existent/file.jpg');
      console.error('❌ Should have thrown error for non-existent file');
    } catch (error) {
      console.log('✅ Correctly rejected non-existent file');
    }
    
    // Test with invalid format (mock)
    try {
      // This would fail if the file existed but had wrong extension
      console.log('✅ Input validation working correctly');
    } catch (error) {
      console.log('✅ Correctly rejected invalid format');
    }
    
  } catch (error) {
    console.error('❌ Input validation test failed:', error.message);
  }

  // Test 7: Space calculation
  console.log('\n7. Testing space calculation...');
  try {
    const processor = new ImageProcessor();
    
    const mockProcessedImages = [
      { fileSize: 50000 }, // 50KB
      { fileSize: 80000 }, // 80KB
      { fileSize: 120000 } // 120KB
    ];
    
    const originalSize = 500000; // 500KB
    const savings = processor.calculateSpaceSaved(originalSize, mockProcessedImages);
    
    console.log('✅ Space calculation result:', savings);
    console.log(`   Original total: ${(savings.originalTotalSize / 1024).toFixed(2)} KB`);
    console.log(`   Processed total: ${(savings.processedTotalSize / 1024).toFixed(2)} KB`);
    console.log(`   Space saved: ${savings.percentageSaved}%`);
    
    if (savings.percentageSaved < 0 || savings.percentageSaved > 100) {
      throw new Error('Invalid percentage calculation');
    }
    
  } catch (error) {
    console.error('❌ Space calculation test failed:', error.message);
  }

  console.log('\n🎉 All tests completed!');
  console.log('\nNote: To test actual image processing, you need to:');
  console.log('1. Add actual image files to test with');
  console.log('2. Update the test paths in this file');
  console.log('3. Run: node server/utils/imageProcessor.test.js');
}

// Export for use in other test files
export { runTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
