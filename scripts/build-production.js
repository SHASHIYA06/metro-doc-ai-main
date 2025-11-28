#!/usr/bin/env node

/**
 * Production Build Script for KMRCL Metro Document Intelligence
 * Handles dependency installation and build process for deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const log = (message) => console.log(`🔧 ${message}`);
const error = (message) => console.error(`❌ ${message}`);
const success = (message) => console.log(`✅ ${message}`);

try {
  log('Starting production build process...');

  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found. Please run this script from the project root.');
  }

  // Clean previous build
  log('Cleaning previous build...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }

  // Install dependencies with clean install
  log('Installing dependencies...');
  execSync('npm ci --prefer-offline --no-audit', { stdio: 'inherit' });

  // Run the build
  log('Building application...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Verify build output
  if (!fs.existsSync('dist/index.html')) {
    throw new Error('Build failed: dist/index.html not found');
  }

  // Check build size
  const stats = fs.statSync('dist');
  success(`Build completed successfully!`);
  success(`Output directory: dist/`);
  
  // List build files
  const files = fs.readdirSync('dist');
  log('Build files:');
  files.forEach(file => {
    const filePath = path.join('dist', file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      const size = (stat.size / 1024).toFixed(2);
      console.log(`  📄 ${file} (${size} KB)`);
    } else {
      console.log(`  📁 ${file}/`);
    }
  });

  success('Production build ready for deployment!');

} catch (err) {
  error(`Build failed: ${err.message}`);
  process.exit(1);
}