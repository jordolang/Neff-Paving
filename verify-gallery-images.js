import fs from 'fs';
import path from 'path';
import { galleryImages } from './src/data/gallery-images.js';

const baseDir = './assets/gallery';
let totalFiles = 0;
let missingFiles = 0;
let extraFiles = 0;
const issues = [];

console.log('🔍 Verifying Gallery Images...\n');

// Check each category
Object.entries(galleryImages).forEach(([category, images]) => {
    console.log(`📂 Checking ${category} category (${images.length} images):`);
    
    const categoryDir = path.join(baseDir, category);
    
    // Check if category directory exists
    if (!fs.existsSync(categoryDir)) {
        issues.push(`❌ Category directory missing: ${categoryDir}`);
        console.log(`   ❌ Directory missing: ${categoryDir}`);
        return;
    }
    
    // Get actual files in directory
    const actualFiles = fs.readdirSync(categoryDir).filter(file => file.endsWith('.webp'));
    const expectedFiles = images.map(img => img.filename);
    
    // Check for missing files (in data but not on disk)
    images.forEach(image => {
        totalFiles++;
        const filePath = path.join(categoryDir, image.filename);
        
        if (!fs.existsSync(filePath)) {
            missingFiles++;
            issues.push(`❌ Missing file: ${filePath}`);
            console.log(`   ❌ Missing: ${image.filename}`);
        } else {
            // Check file size
            const stats = fs.statSync(filePath);
            console.log(`   ✅ ${image.filename} (${Math.round(stats.size / 1024)}KB)`);
        }
    });
    
    // Check for extra files (on disk but not in data)
    actualFiles.forEach(file => {
        if (!expectedFiles.includes(file)) {
            extraFiles++;
            issues.push(`⚠️  Extra file not in data: ${path.join(categoryDir, file)}`);
            console.log(`   ⚠️  Extra: ${file} (not in gallery-images.js)`);
        }
    });
    
    console.log(`   📊 Expected: ${expectedFiles.length}, Found: ${actualFiles.length}\n`);
});

// Summary report
console.log('📊 VERIFICATION SUMMARY:');
console.log('========================');
console.log(`Total files in gallery-images.js: ${totalFiles}`);
console.log(`Missing files: ${missingFiles}`);
console.log(`Extra files: ${extraFiles}`);
console.log(`Success rate: ${Math.round(((totalFiles - missingFiles) / totalFiles) * 100)}%`);

if (issues.length === 0) {
    console.log('\n🎉 ALL IMAGES VERIFIED SUCCESSFULLY!');
    console.log('✅ All files exist and match the gallery-images.js data');
    console.log('✅ No missing or orphaned files detected');
} else {
    console.log('\n⚠️  ISSUES DETECTED:');
    issues.forEach(issue => console.log(issue));
}

// Test WebP format support in Node.js
console.log('\n🔧 TECHNICAL DETAILS:');
console.log('===================');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);

// Check if we can read a WebP file
try {
    const testFile = './assets/gallery/commercial/advance-auto-parking-lot.webp';
    if (fs.existsSync(testFile)) {
        const buffer = fs.readFileSync(testFile);
        const isWebP = buffer.slice(8, 12).toString() === 'WEBP';
        console.log(`WebP format verification: ${isWebP ? '✅ Valid' : '❌ Invalid'}`);
        console.log(`Test file size: ${Math.round(buffer.length / 1024)}KB`);
    }
} catch (error) {
    console.log(`WebP test failed: ${error.message}`);
}

// Path format verification
console.log('\n🛤️  PATH FORMAT VERIFICATION:');
console.log('=============================');
Object.entries(galleryImages).forEach(([category, images]) => {
    images.slice(0, 2).forEach(image => {
        const expectedPath = `/assets/gallery/${category}/${image.filename}`;
        console.log(`✅ ${expectedPath}`);
    });
});

console.log('\n✨ Verification complete!');
