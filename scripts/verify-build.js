#!/usr/bin/env node

// Build verification script for KMRCL Metro Intelligence

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Verifying build for KMRCL Metro Intelligence...\n');

const checks = [
  {
    name: 'Environment files exist',
    check: () => {
      const files = ['.env.example', '.env.production', 'netlify.toml'];
      return files.every(file => fs.existsSync(path.join(projectRoot, file)));
    }
  },
  {
    name: 'Backend configuration exists',
    check: () => {
      const files = ['backend/package.json', 'backend/server.js', 'backend/render.yaml'];
      return files.every(file => fs.existsSync(path.join(projectRoot, file)));
    }
  },
  {
    name: 'Frontend configuration exists',
    check: () => {
      const files = ['src/config/environment.ts', 'src/services/api.ts'];
      return files.every(file => fs.existsSync(path.join(projectRoot, file)));
    }
  },
  {
    name: 'Package.json has required scripts',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      const requiredScripts = ['build', 'build:prod', 'preview'];
      return requiredScripts.every(script => packageJson.scripts[script]);
    }
  },
  {
    name: 'Dependencies are installed',
    check: () => {
      return fs.existsSync(path.join(projectRoot, 'node_modules')) &&
             fs.existsSync(path.join(projectRoot, 'backend/node_modules'));
    }
  }
];

let allPassed = true;

checks.forEach(({ name, check }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (!passed) allPassed = false;
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Push code to GitHub');
  console.log('2. Deploy backend to Render');
  console.log('3. Deploy frontend to Netlify');
  console.log('4. Update environment variables');
  console.log('5. Test the deployed application');
} else {
  console.log('❌ Some checks failed. Please fix the issues before deploying.');
  process.exit(1);
}

console.log('\n📚 See DEPLOYMENT_CHECKLIST.md for detailed instructions.');