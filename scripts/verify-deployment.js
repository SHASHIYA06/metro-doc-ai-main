#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Verifies that the application is ready for deployment
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 DEPLOYMENT VERIFICATION\n');
console.log('='.repeat(50));

async function verifyDeployment() {
    let checks = 0;
    let passed = 0;

    // Check 1: Build Success
    console.log('\n1️⃣ Testing Production Build...');
    checks++;
    try {
        execSync('npm run build:prod', { stdio: 'pipe' });
        console.log('   ✅ Production build successful');
        passed++;
    } catch (error) {
        console.log('   ❌ Production build failed');
        console.log('   Error:', error.message);
    }

    // Check 2: Required Files
    console.log('\n2️⃣ Checking Required Files...');
    checks++;
    const requiredFiles = [
        'dist/index.html',
        'netlify.toml',
        'package.json',
        'src/components/SimpleAISearch.tsx',
        'src/services/googleDriveBEML.ts'
    ];

    let allFilesExist = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file} - MISSING`);
            allFilesExist = false;
        }
    });

    if (allFilesExist) {
        console.log('   ✅ All required files present');
        passed++;
    }

    // Check 3: BEML Service Test
    console.log('\n3️⃣ Testing BEML Service...');
    checks++;
    try {
        execSync('npm run test:beml-fix', { stdio: 'pipe' });
        console.log('   ✅ BEML service test passed');
        passed++;
    } catch (error) {
        console.log('   ❌ BEML service test failed');
    }

    // Check 4: Environment Configuration
    console.log('\n4️⃣ Checking Environment Configuration...');
    checks++;
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const hasDevScript = packageJson.scripts && packageJson.scripts.dev;
        const hasBuildScript = packageJson.scripts && packageJson.scripts['build:prod'];
        
        if (hasDevScript && hasBuildScript) {
            console.log('   ✅ Package.json scripts configured');
            passed++;
        } else {
            console.log('   ❌ Missing required scripts in package.json');
        }
    } catch (error) {
        console.log('   ❌ Could not verify package.json');
    }

    // Results
    console.log('\n' + '='.repeat(50));
    console.log('📊 DEPLOYMENT VERIFICATION RESULTS');
    console.log('='.repeat(50));
    
    console.log(`\n📈 Checks Passed: ${passed}/${checks}`);
    console.log(`📊 Success Rate: ${Math.round((passed/checks) * 100)}%`);

    if (passed === checks) {
        console.log('\n🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!');
        console.log('\n✅ DEPLOYMENT READY:');
        console.log('   🏗️ Production build successful');
        console.log('   📁 All required files present');
        console.log('   🔧 BEML service working');
        console.log('   ⚙️ Environment configured');
        
        console.log('\n🚀 NETLIFY DEPLOYMENT:');
        console.log('   1. Push to GitHub: git push origin main');
        console.log('   2. Connect to Netlify');
        console.log('   3. Deploy from GitHub repository');
        console.log('   4. Build command: npm run build:prod');
        console.log('   5. Publish directory: dist');
        
        return true;
    } else {
        console.log('\n⚠️ SOME CHECKS FAILED - REVIEW NEEDED');
        console.log('\n🔧 RECOMMENDATIONS:');
        console.log('   1. Fix any build errors');
        console.log('   2. Ensure all required files are present');
        console.log('   3. Verify BEML service functionality');
        console.log('   4. Check environment configuration');
        
        return false;
    }
}

// Run verification
verifyDeployment()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    });