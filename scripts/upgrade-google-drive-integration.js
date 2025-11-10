#!/usr/bin/env node

// Upgrade Google Drive Integration Script
// Author: SHASHI SHEKHAR MISHRA
// Upgrades the application with correct Google Apps Script URL and Sheet ID

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Upgrading Google Drive Integration');
console.log('📍 Apps Script URL: https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec');
console.log('📊 Sheet ID: 1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8');
console.log('');

// Configuration
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';
const GOOGLE_SHEET_ID = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8';

function updateEnvironmentConfig() {
    console.log('🔧 Updating environment configuration...');
    
    const configPath = path.join(process.cwd(), 'src', 'config', 'environment.ts');
    
    if (!fs.existsSync(configPath)) {
        console.log('❌ Environment config file not found:', configPath);
        return false;
    }
    
    try {
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Update the Google Apps Script URL
        configContent = configContent.replace(
            /const APP_SCRIPT_URL = [^;]+;/,
            `const APP_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL || 
    '${GOOGLE_APPS_SCRIPT_URL}';`
        );
        
        // Update the Sheet ID
        configContent = configContent.replace(
            /MAIN_FOLDER_ID: '[^']*'/,
            `MAIN_FOLDER_ID: '${GOOGLE_SHEET_ID}'`
        );
        
        // Ensure the configuration is properly set
        if (!configContent.includes(GOOGLE_APPS_SCRIPT_URL)) {
            console.log('⚠️ Adding Google Apps Script URL to config...');
            configContent = configContent.replace(
                'APP_SCRIPT_URL,',
                `APP_SCRIPT_URL: '${GOOGLE_APPS_SCRIPT_URL}',`
            );
        }
        
        fs.writeFileSync(configPath, configContent);
        console.log('✅ Environment configuration updated');
        return true;
    } catch (error) {
        console.error('❌ Failed to update environment config:', error.message);
        return false;
    }
}

function createEnhancedEnvFiles() {
    console.log('🔧 Creating enhanced environment files...');
    
    // Update .env.example
    const envExampleContent = `# KMRCL Metro Document Intelligence - Enhanced Environment Variables

# Backend API URL
# For development: http://localhost:3000
# For production: https://your-backend-url.onrender.com
VITE_API_BASE_URL=http://localhost:3000

# Google Apps Script Integration (UPDATED)
VITE_APP_SCRIPT_URL=${GOOGLE_APPS_SCRIPT_URL}
VITE_GOOGLE_SHEET_ID=${GOOGLE_SHEET_ID}

# Application Configuration
VITE_APP_NAME="KMRCL Metro Document Intelligence"
VITE_APP_VERSION="2.0.0"

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ENHANCED_GOOGLE_DRIVE=true

# Optional: Google Analytics ID
# VITE_GA_ID=G-XXXXXXXXXX
`;
    
    fs.writeFileSync('.env.example', envExampleContent);
    console.log('✅ Updated .env.example with Google Drive configuration');
    
    // Create .env.development if it doesn't exist
    if (!fs.existsSync('.env.development')) {
        const envDevContent = `# Development Environment - KMRCL Metro Document Intelligence

# Backend API URL
VITE_API_BASE_URL=http://localhost:3000

# Google Apps Script Integration
VITE_APP_SCRIPT_URL=${GOOGLE_APPS_SCRIPT_URL}
VITE_GOOGLE_SHEET_ID=${GOOGLE_SHEET_ID}

# Application Configuration
VITE_APP_NAME="KMRCL Metro Document Intelligence (Dev)"
VITE_APP_VERSION="2.0.0-dev"

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ENHANCED_GOOGLE_DRIVE=true
`;
        
        fs.writeFileSync('.env.development', envDevContent);
        console.log('✅ Created .env.development with Google Drive configuration');
    }
    
    // Create .env.production if it doesn't exist
    if (!fs.existsSync('.env.production')) {
        const envProdContent = `# Production Environment - KMRCL Metro Document Intelligence

# Backend API URL - UPDATE THIS AFTER BACKEND DEPLOYMENT
VITE_API_BASE_URL=https://your-backend-url.onrender.com

# Google Apps Script Integration
VITE_APP_SCRIPT_URL=${GOOGLE_APPS_SCRIPT_URL}
VITE_GOOGLE_SHEET_ID=${GOOGLE_SHEET_ID}

# Application Configuration
VITE_APP_NAME="KMRCL Metro Document Intelligence"
VITE_APP_VERSION="2.0.0"

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ENHANCED_GOOGLE_DRIVE=true

# Optional: Google Analytics ID
# VITE_GA_ID=G-XXXXXXXXXX
`;
        
        fs.writeFileSync('.env.production', envProdContent);
        console.log('✅ Created .env.production with Google Drive configuration');
    }
    
    return true;
}

function updatePackageJson() {
    console.log('🔧 Updating package.json scripts...');
    
    try {
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Add new scripts for Google Drive testing
        packageJson.scripts = {
            ...packageJson.scripts,
            'test:google-drive': 'node scripts/test-google-drive-integration.js',
            'upgrade:google-drive': 'node scripts/upgrade-google-drive-integration.js',
            'dev:enhanced': 'VITE_ENABLE_ENHANCED_GOOGLE_DRIVE=true npm run dev',
            'build:enhanced': 'VITE_ENABLE_ENHANCED_GOOGLE_DRIVE=true npm run build:prod'
        };
        
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Updated package.json with Google Drive scripts');
        return true;
    } catch (error) {
        console.error('❌ Failed to update package.json:', error.message);
        return false;
    }
}

function createGoogleDriveDocumentation() {
    console.log('📝 Creating Google Drive integration documentation...');
    
    const docContent = `# Google Drive Integration - KMRCL Metro Document Intelligence

## Configuration

### Google Apps Script URL
\`\`\`
${GOOGLE_APPS_SCRIPT_URL}
\`\`\`

### Google Sheet ID
\`\`\`
${GOOGLE_SHEET_ID}
\`\`\`

## Features

### Enhanced Google Drive Service
- ✅ Correct Google Apps Script URL integration
- ✅ Proper Google Sheet ID configuration
- ✅ Enhanced error handling and fallback mechanisms
- ✅ Caching for improved performance
- ✅ Multiple extraction methods for file content
- ✅ Comprehensive logging and debugging

### Supported File Types
- PDF documents with OCR fallback
- Microsoft Office documents (Word, Excel, PowerPoint)
- Google Workspace files (Docs, Sheets, Slides)
- Images with OCR text extraction
- CAD files (DWG, DXF) with metadata extraction
- Text files and CSV data

### API Endpoints Tested
1. **Connection Test**: \`?action=test&sheetId={SHEET_ID}\`
2. **Folder Listing**: \`?action=listTree&sheetId={SHEET_ID}\`
3. **File Listing**: \`?action=listFiles&sheetId={SHEET_ID}\`
4. **File Download**: \`?action=downloadBase64&fileId={FILE_ID}&sheetId={SHEET_ID}\`

## Testing

### Run Google Drive Integration Tests
\`\`\`bash
npm run test:google-drive
\`\`\`

### Development with Enhanced Google Drive
\`\`\`bash
npm run dev:enhanced
\`\`\`

### Production Build with Enhanced Google Drive
\`\`\`bash
npm run build:enhanced
\`\`\`

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check Google Apps Script URL and permissions
2. **No Files Found**: Verify Google Sheet ID and data structure
3. **Content Extraction Failed**: Ensure file permissions and format support

### Debug Mode
Enable debug mode in environment variables:
\`\`\`
VITE_ENABLE_DEBUG=true
\`\`\`

### Cache Management
The enhanced service includes caching for better performance. Cache is automatically managed but can be cleared if needed.

## Integration Status
- ✅ Google Apps Script URL: Configured
- ✅ Google Sheet ID: Configured  
- ✅ Enhanced Service: Implemented
- ✅ Error Handling: Enhanced
- ✅ Caching: Enabled
- ✅ Testing: Comprehensive

## Last Updated
${new Date().toISOString()}

## Author
SHASHI SHEKHAR MISHRA
`;
    
    fs.writeFileSync('GOOGLE_DRIVE_INTEGRATION.md', docContent);
    console.log('✅ Created Google Drive integration documentation');
    return true;
}

function runUpgrade() {
    console.log('🚀 Starting Google Drive integration upgrade...\n');
    
    const tasks = [
        { name: 'Update Environment Configuration', task: updateEnvironmentConfig },
        { name: 'Create Enhanced Environment Files', task: createEnhancedEnvFiles },
        { name: 'Update Package.json Scripts', task: updatePackageJson },
        { name: 'Create Documentation', task: createGoogleDriveDocumentation }
    ];
    
    const results = [];
    
    for (const { name, task } of tasks) {
        console.log(`🔧 ${name}...`);
        const success = task();
        results.push({ name, success });
        console.log(`${success ? '✅' : '❌'} ${name}: ${success ? 'COMPLETED' : 'FAILED'}\n`);
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 UPGRADE SUMMARY');
    console.log('='.repeat(60));
    
    const completed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(({ name, success }) => {
        console.log(`${success ? '✅' : '❌'} ${name}`);
    });
    
    console.log(`\n📈 Results: ${completed}/${total} tasks completed`);
    
    if (completed === total) {
        console.log('\n🎉 Google Drive integration upgrade completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Test the integration: npm run test:google-drive');
        console.log('2. Start development: npm run dev:enhanced');
        console.log('3. Check the application with the enhanced Google Drive service');
        console.log('4. Review GOOGLE_DRIVE_INTEGRATION.md for detailed information');
    } else {
        console.log('\n⚠️ Some upgrade tasks failed. Please check the errors above.');
    }
    
    console.log('\n📋 Configuration Applied:');
    console.log(`   Apps Script URL: ${GOOGLE_APPS_SCRIPT_URL}`);
    console.log(`   Sheet ID: ${GOOGLE_SHEET_ID}`);
    console.log(`   Upgrade Time: ${new Date().toISOString()}`);
}

// Run the upgrade
runUpgrade();