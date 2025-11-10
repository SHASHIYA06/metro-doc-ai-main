# Google Drive Integration - KMRCL Metro Document Intelligence

## Configuration

### Google Apps Script URL
```
https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec
```

### Google Sheet ID
```
1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8
```

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
1. **Connection Test**: `?action=test&sheetId={SHEET_ID}`
2. **Folder Listing**: `?action=listTree&sheetId={SHEET_ID}`
3. **File Listing**: `?action=listFiles&sheetId={SHEET_ID}`
4. **File Download**: `?action=downloadBase64&fileId={FILE_ID}&sheetId={SHEET_ID}`

## Testing

### Run Google Drive Integration Tests
```bash
npm run test:google-drive
```

### Development with Enhanced Google Drive
```bash
npm run dev:enhanced
```

### Production Build with Enhanced Google Drive
```bash
npm run build:enhanced
```

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check Google Apps Script URL and permissions
2. **No Files Found**: Verify Google Sheet ID and data structure
3. **Content Extraction Failed**: Ensure file permissions and format support

### Debug Mode
Enable debug mode in environment variables:
```
VITE_ENABLE_DEBUG=true
```

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
2025-11-10T07:55:21.765Z

## Author
SHASHI SHEKHAR MISHRA
