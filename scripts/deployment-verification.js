#!/usr/bin/env node

/**
 * KMRCL Metro Intelligence - Deployment Verification Script
 * This script verifies that all components are ready for deployment
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 KMRCL Metro Intelligence - Deployment Verification\n');

const checks = [];

// Check if all required files exist
const requiredFiles = [
  'src/components/MetroDashboard.tsx',
  'src/components/Enhanced3DBackground.tsx',
  'src/services/exportService.ts',
  'src/services/googleDrive.ts',
  'src/config/environment.ts',
  'backend/server.js',
  'google-apps-script/Code.gs',
  'package.json',
  '.env.production'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  checks.push({ name: `File: ${file}`, passed: exists });
});

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    '@google/generative-ai',
    'react',
    'react-dom',
    'typescript',
    'vite',
    'tailwindcss',
    'framer-motion',
    'lucide-react',
    'react-hot-toast',
    'jspdf',
    'docx',
    'exceljs'
  ];
  
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredDeps.forEach(dep => {
    const exists = allDeps[dep] !== undefined;
    console.log(`   ${exists ? '✅' : '❌'} ${dep}`);
    checks.push({ name: `Dependency: ${dep}`, passed: exists });
  });
} catch (error) {
  console.log('   ❌ Error reading package.json');
  checks.push({ name: 'Package.json readable', passed: false });
}

// Check environment configuration
console.log('\n🔧 Checking environment configuration...');
try {
  const envContent = fs.readFileSync('.env.production', 'utf8');
  
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
    'VITE_APP_SCRIPT_URL'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const exists = envContent.includes(envVar);
    console.log(`   ${exists ? '✅' : '❌'} ${envVar}`);
    checks.push({ name: `Env var: ${envVar}`, passed: exists });
  });
} catch (error) {
  console.log('   ❌ Error reading .env.production');
  checks.push({ name: '.env.production readable', passed: false });
}

// Check Google Apps Script
console.log('\n📜 Checking Google Apps Script...');
try {
  const scriptContent = fs.readFileSync('google-apps-script/Code.gs', 'utf8');
  
  const scriptChecks = [
    { name: 'Contains MAIN_FOLDER_ID', check: scriptContent.includes('1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8') },
    { name: 'Contains doGet function', check: scriptContent.includes('function doGet') },
    { name: 'Contains doPost function', check: scriptContent.includes('function doPost') },
    { name: 'Contains file upload handler', check: scriptContent.includes('handleFileUpload') },
    { name: 'Contains CORS headers', check: scriptContent.includes('CORS') }
  ];
  
  scriptChecks.forEach(check => {
    console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
    checks.push({ name: `Script: ${check.name}`, passed: check.check });
  });
} catch (error) {
  console.log('   ❌ Error reading Google Apps Script');
  checks.push({ name: 'Google Apps Script readable', passed: false });
}

// Check build configuration
console.log('\n🏗️  Checking build configuration...');
try {
  const viteConfig = fs.existsSync('vite.config.ts');
  const tsConfig = fs.existsSync('tsconfig.json');
  const tailwindConfig = fs.existsSync('tailwind.config.js') || fs.existsSync('tailwind.config.ts');
  
  console.log(`   ${viteConfig ? '✅' : '❌'} vite.config.ts`);
  console.log(`   ${tsConfig ? '✅' : '❌'} tsconfig.json`);
  console.log(`   ${tailwindConfig ? '✅' : '❌'} tailwind.config.js`);
  
  checks.push({ name: 'Vite config', passed: viteConfig });
  checks.push({ name: 'TypeScript config', passed: tsConfig });
  checks.push({ name: 'Tailwind config', passed: tailwindConfig });
} catch (error) {
  console.log('   ❌ Error checking build configuration');
}

// Summary
console.log('\n📊 VERIFICATION SUMMARY');
console.log('========================');

const passed = checks.filter(c => c.passed).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);

if (percentage === 100) {
  console.log('\n🎉 ALL CHECKS PASSED! Ready for deployment! 🚀');
  console.log('\nNext steps:');
  console.log('1. Deploy Google Apps Script to script.google.com');
  console.log('2. Deploy backend to Render.com');
  console.log('3. Deploy frontend to Netlify.com');
  console.log('4. Update environment variables with actual URLs');
  console.log('5. Test the complete application');
} else {
  console.log('\n⚠️  Some checks failed. Please review the issues above.');
  console.log('\nFailed checks:');
  checks.filter(c => !c.passed).forEach(check => {
    console.log(`   ❌ ${check.name}`);
  });
}

console.log('\n📖 For detailed deployment instructions, see: FINAL_DEPLOYMENT_GUIDE.md');
console.log('🔗 Repository: https://github.com/SHASHIYA06/metro-doc-ai-main');

process.exit(percentage === 100 ? 0 : 1);