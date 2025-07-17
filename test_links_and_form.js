// Test script to check all links and form functionality
const puppeteer = require('puppeteer');

async function testLinksAndForm() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Testing Neff Paving Links and Estimate Form...\n');
        
        // Test 1: Load main page
        console.log('1. Testing main page load...');
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle2' });
        console.log('✅ Main page loaded successfully');
        
        // Test 2: Check all navigation links
        console.log('\n2. Testing navigation links...');
        
        // Get all navigation links
        const navLinks = await page.evaluate(() => {
            const links = document.querySelectorAll('nav a');
            return Array.from(links).map(link => ({
                text: link.textContent,
                href: link.getAttribute('href'),
                target: link.getAttribute('target')
            }));
        });
        
        console.log('Found navigation links:');
        navLinks.forEach(link => console.log(`   - ${link.text}: ${link.href}`));
        
        // Test 3: Test "Get Estimate" link specifically
        console.log('\n3. Testing "Get Estimate" link...');
        
        const estimateLink = await page.$('a[href="assets/paving-estimate-form.html"]');
        if (estimateLink) {
            console.log('✅ Found "Get Estimate" link in navigation');
            
            // Click the estimate link
            await estimateLink.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            
            // Check if we're on the estimate form page
            const currentUrl = page.url();
            console.log(`   Current URL: ${currentUrl}`);
            
            if (currentUrl.includes('paving-estimate-form.html')) {
                console.log('✅ Successfully navigated to estimate form');
            } else {
                console.log('❌ Failed to navigate to estimate form');
            }
        } else {
            console.log('❌ "Get Estimate" link not found');
        }
        
        // Test 4: Test form functionality
        console.log('\n4. Testing estimate form functionality...');
        
        // Check if form elements exist
        const formElements = await page.evaluate(() => {
            const elements = {
                customerName: document.getElementById('customerName'),
                email: document.getElementById('email'),
                phone: document.getElementById('phone'),
                address: document.getElementById('address'),
                projectType: document.getElementById('projectType'),
                material: document.getElementById('material'),
                notes: document.getElementById('notes'),
                map: document.getElementById('map'),
                submitBtn: document.getElementById('submitBtn'),
                estimateForm: document.getElementById('estimateForm')
            };
            
            return Object.fromEntries(
                Object.entries(elements).map(([key, element]) => [key, element !== null])
            );
        });
        
        console.log('Form elements status:');
        Object.entries(formElements).forEach(([element, exists]) => {
            console.log(`   ${element}: ${exists ? '✅ Present' : '❌ Missing'}`);
        });
        
        // Test 5: Test form interactions
        console.log('\n5. Testing form interactions...');
        
        // Fill out form fields
        await page.type('#customerName', 'John Doe');
        await page.type('#email', 'john.doe@example.com');
        await page.type('#phone', '555-123-4567');
        await page.type('#address', '123 Main St, Columbus, OH');
        await page.select('#projectType', 'driveway');
        await page.select('#material', 'asphalt');
        await page.type('#notes', 'Test estimate request');
        
        console.log('✅ Form fields filled successfully');
        
        // Test 6: Check JavaScript functionality
        console.log('\n6. Testing JavaScript functionality...');
        
        // Check if Google Maps and drawing functionality are available
        const jsStatus = await page.evaluate(() => {
            const status = {
                googleMapsLoaded: typeof google !== 'undefined' && typeof google.maps !== 'undefined',
                drawingManagerExists: typeof google !== 'undefined' && typeof google.maps !== 'undefined' && typeof google.maps.drawing !== 'undefined',
                mapVariable: typeof map !== 'undefined',
                drawingManagerVariable: typeof drawingManager !== 'undefined',
                startDrawingFunction: typeof startDrawing === 'function',
                clearPolygonFunction: typeof clearPolygon === 'function',
                calculateAreaFunction: typeof calculateArea === 'function',
                materialPricesObject: typeof materialPrices !== 'undefined'
            };
            return status;
        });
        
        console.log('JavaScript functionality status:');
        Object.entries(jsStatus).forEach(([feature, available]) => {
            console.log(`   ${feature}: ${available ? '✅ Available' : '❌ Missing'}`);
        });
        
        // Test 7: Test map controls
        console.log('\n7. Testing map controls...');
        
        const mapControls = await page.evaluate(() => {
            const drawBtn = document.querySelector('button[onclick="startDrawing()"]');
            const clearBtn = document.querySelector('button[onclick="clearPolygon()"]');
            const deleteBtn = document.querySelector('button[onclick="deleteSelected()"]');
            
            return {
                drawButton: drawBtn !== null,
                clearButton: clearBtn !== null,
                deleteButton: deleteBtn !== null
            };
        });
        
        console.log('Map controls status:');
        Object.entries(mapControls).forEach(([control, exists]) => {
            console.log(`   ${control}: ${exists ? '✅ Present' : '❌ Missing'}`);
        });
        
        // Test 8: Test price calculation display
        console.log('\n8. Testing price calculation display...');
        
        const priceElements = await page.evaluate(() => {
            return {
                areaDisplay: document.getElementById('areaDisplay') !== null,
                materialCost: document.getElementById('materialCost') !== null,
                laborCost: document.getElementById('laborCost') !== null,
                equipmentCost: document.getElementById('equipmentCost') !== null,
                totalPrice: document.getElementById('totalPrice') !== null
            };
        });
        
        console.log('Price calculation elements:');
        Object.entries(priceElements).forEach(([element, exists]) => {
            console.log(`   ${element}: ${exists ? '✅ Present' : '❌ Missing'}`);
        });
        
        // Test 9: Test form validation
        console.log('\n9. Testing form validation...');
        
        // Check if submit button is initially disabled
        const submitBtnDisabled = await page.evaluate(() => {
            const submitBtn = document.getElementById('submitBtn');
            return submitBtn ? submitBtn.disabled : null;
        });
        
        console.log(`Submit button disabled state: ${submitBtnDisabled ? '✅ Disabled (correct)' : '❌ Enabled (incorrect)'}`);
        
        // Test 10: Test hero section links
        console.log('\n10. Testing hero section links...');
        
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle2' });
        
        const heroLinks = await page.evaluate(() => {
            const links = document.querySelectorAll('#hero a');
            return Array.from(links).map(link => ({
                text: link.textContent,
                href: link.getAttribute('href'),
                class: link.getAttribute('class')
            }));
        });
        
        console.log('Hero section links:');
        heroLinks.forEach(link => console.log(`   - ${link.text}: ${link.href}`));
        
        // Test the "Get Free Quote" button in hero
        const heroEstimateLink = await page.$('#hero a[href="assets/paving-estimate-form.html"]');
        if (heroEstimateLink) {
            console.log('✅ Found "Get Free Quote" button in hero section');
            
            // Test clicking it
            await heroEstimateLink.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            
            if (page.url().includes('paving-estimate-form.html')) {
                console.log('✅ Hero "Get Free Quote" button navigates correctly');
            } else {
                console.log('❌ Hero "Get Free Quote" button navigation failed');
            }
        } else {
            console.log('❌ "Get Free Quote" button not found in hero section');
        }
        
        // Test 11: Test other estimate links throughout the page
        console.log('\n11. Testing other estimate links...');
        
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle2' });
        
        const allEstimateLinks = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href*="paving-estimate-form.html"], a[href*="estimate"], a[href="#contact"]');
            return Array.from(links).map(link => ({
                text: link.textContent.trim(),
                href: link.getAttribute('href'),
                section: link.closest('section')?.id || 'unknown'
            }));
        });
        
        console.log(`Found ${allEstimateLinks.length} estimate-related links:`);
        allEstimateLinks.forEach(link => console.log(`   - "${link.text}" (${link.section}): ${link.href}`));
        
        console.log('\n✅ Link and form testing completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testLinksAndForm().catch(console.error);
