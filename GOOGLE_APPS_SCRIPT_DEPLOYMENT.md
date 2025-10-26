# 🚀 Google Apps Script Deployment Guide - CRITICAL

## ⚠️ **URGENT: Your Google Apps Script needs to be updated with the new code**

The test shows that your current deployed Apps Script doesn't have the updated code with the `test` action. You need to redeploy it.

---

## 📋 **STEP-BY-STEP DEPLOYMENT INSTRUCTIONS**

### **Step 1: Access Google Apps Script Console**
1. Go to: https://script.google.com
2. Sign in with your Google account
3. Look for your existing project "KMRCL Metro Drive Integration" OR create a new one

### **Step 2: Update the Script Code**
1. **IMPORTANT**: Delete ALL existing code in the script editor
2. Copy the **ENTIRE** content from `google-apps-script/Code.gs` file
3. Paste it into the script editor (replacing everything)
4. Save the project (Ctrl+S or Cmd+S)

### **Step 3: Enable Google Drive API**
1. In the left sidebar, click "Services" (+ icon)
2. Find "Drive API" and click "Add"
3. Set the identifier as "Drive"
4. Click "Add"

### **Step 4: Deploy as Web App**
1. Click "Deploy" button (top right)
2. Choose "New deployment"
3. Click the gear icon ⚙️ next to "Type"
4. Select "Web app"
5. Fill in the details:
   - **Description**: "KMRCL Metro Drive Integration v2.0"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone" ⚠️ **CRITICAL - Must be "Anyone"**
6. Click "Deploy"
7. **IMPORTANT**: Copy the new Web App URL

### **Step 5: Update Your Environment Variables**
If you get a new URL, update it in:
- Netlify environment variables: `VITE_APP_SCRIPT_URL`
- Your local `.env.production` file

---

## 🧪 **TESTING YOUR DEPLOYMENT**

### **Test 1: Basic Connection**
Visit this URL in your browser (replace with your actual URL):
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=test
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "KMRCL Google Apps Script is working!",
  "timestamp": "2024-...",
  "folderId": "1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8",
  "version": "2.0.0"
}
```

### **Test 2: File Listing**
Visit this URL:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=listFiles
```

**Expected Response:**
```json
{
  "ok": true,
  "files": [
    {
      "id": "...",
      "name": "filename.pdf",
      "type": "file",
      ...
    }
  ]
}
```

### **Test 3: Run Our Test Script**
After deployment, run:
```bash
node scripts/test-google-drive.js
```

**Expected Output:**
```
✅ Basic connection test PASSED
✅ File listing test PASSED
✅ Folder listing test PASSED
🎉 ALL TESTS PASSED!
```

---

## 🔧 **TROUBLESHOOTING**

### **❌ "Invalid or missing action" Error**
- **Cause**: Old script code is still deployed
- **Solution**: Follow Step 2 above - completely replace the script code

### **❌ "Script function not found" Error**
- **Cause**: Google Drive API not enabled
- **Solution**: Follow Step 3 above - enable Drive API service

### **❌ "Access denied" Error**
- **Cause**: Web app not deployed with "Anyone" access
- **Solution**: Follow Step 4 above - redeploy with "Anyone" access

### **❌ CORS Errors in Browser**
- **Cause**: Missing CORS headers in script
- **Solution**: Ensure you're using the updated script code with CORS headers

---

## 📝 **COMPLETE SCRIPT CODE TO COPY**

Make sure you copy this EXACT code to your Apps Script:

```javascript
// Google Apps Script for KMRCL Metro Document Intelligence
// This script handles Google Drive integration for file management and search

// Configuration
const MAIN_FOLDER_ID = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8'; // Your main Google Drive folder ID
const MAX_FILES_PER_REQUEST = 100;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

/**
 * Main entry point for all requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'test';
    
    switch (action) {
      case 'test':
        return handleTest(e);
      case 'listFiles':
        return handleListFiles(e);
      case 'listTree':
        return handleListTree(e);
      case 'downloadBase64':
        return handleDownloadFile(e);
      case 'search':
        return handleSearch(e);
      default:
        return createResponse({ 
          error: 'Invalid action', 
          availableActions: ['test', 'listFiles', 'listTree', 'downloadBase64', 'search']
        });
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse({ 
      error: error.toString(),
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle test requests for connection verification
 */
function handleTest(e) {
  try {
    return createResponse({
      ok: true,
      message: 'KMRCL Google Apps Script is working!',
      timestamp: new Date().toISOString(),
      folderId: MAIN_FOLDER_ID,
      version: '2.0.0'
    });
  } catch (error) {
    console.error('Error in test:', error);
    return createResponse({ error: error.toString() });
  }
}

// ... (rest of the functions - copy the complete file)
```

---

## ✅ **VERIFICATION CHECKLIST**

After deployment, verify:

- [ ] Apps Script URL returns test response when visited directly
- [ ] `node scripts/test-google-drive.js` shows all tests passed
- [ ] Frontend application shows "Google Drive: Connected" status
- [ ] File upload works in the application
- [ ] File listing works in Google Drive tab

---

## 🆘 **NEED HELP?**

If you're still having issues:

1. **Check the Apps Script execution log**:
   - In Apps Script console, go to "Executions"
   - Look for error messages

2. **Verify permissions**:
   - Make sure you granted all requested permissions
   - Try running the script manually in the editor

3. **Test step by step**:
   - First test the basic URL in browser
   - Then test with our script
   - Finally test in the application

---

**🎯 CRITICAL: You MUST redeploy the Apps Script with the updated code for the application to work!**