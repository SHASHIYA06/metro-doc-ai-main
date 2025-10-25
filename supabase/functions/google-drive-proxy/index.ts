
// Deno types
declare global {
  interface Window {
    Deno: any;
  }
}

const Deno = window.Deno;

// Add type declarations for npm modules
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js';
// @ts-ignore
import { JWT } from 'npm:google-auth-library@9.6.0';

const MAIN_FOLDER_ID = '1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG';
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Load the service‑account JSON from a secret
const SA_KEY = Deno.env.get('GOOGLE_SA_KEY');
if (!SA_KEY) throw new Error('Missing GOOGLE_SA_KEY secret');

let serviceAccount;
try {
  serviceAccount = JSON.parse(SA_KEY);
} catch (error) {
  console.error('Failed to parse GOOGLE_SA_KEY:', error);
  throw new Error('Invalid GOOGLE_SA_KEY format - must be valid JSON');
}

const jwtClient = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: SCOPES,
});

async function getAccessToken(): Promise<string> {
  const { token } = await jwtClient.authorize();
  if (!token) throw new Error('Failed to obtain access token');
  return token;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json() : {};
    
    // Get action from URL params or request body
    const action = url.searchParams.get('action') || body.action || 'listFiles';
    const fileId = url.searchParams.get('fileId') || body.fileId;

    console.log('Drive proxy request:', { action, fileId });

    const token = await getAccessToken();

    // ----------- Drive API request -----------
    let apiUrl = '';
    if (action === 'listFiles') {
      // Include both files and folders, with webViewLink for folder access
      const folderId = body.folderId || MAIN_FOLDER_ID;
      apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)`;
    } else if (action === 'getFileContent') {
      if (!fileId) {
        return new Response(JSON.stringify({ error: 'File ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // First get file metadata to check if it's a Google Docs file
      const metaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,name`;
      const metaResponse = await fetch(metaUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!metaResponse.ok) {
        throw new Error(`Failed to get file metadata: ${metaResponse.status}`);
      }
      
      const metadata = await metaResponse.json();
      
      // Handle different file types
      if (metadata.mimeType === 'application/vnd.google-apps.document') {
        // Export Google Doc as plain text
        apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
      } else if (metadata.mimeType === 'application/pdf') {
        apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      } else {
        // For other file types, try to get as media
        apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      }
    } else {
      throw new Error('Unsupported action');
    }

    console.log('Requesting Google Drive API:', apiUrl);

    const driveResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!driveResponse.ok) {
      const errBody = await driveResponse.text();
      console.error('Drive API error:', errBody);
      throw new Error(`Drive API error ${driveResponse.status}: ${errBody}`);
    }

    let responseData;

    if (action === 'listFiles') {
      const data = await driveResponse.json();
      console.log('Drive API response:', data);
      
      // Transform the response to match our expected format
      const transformedFiles = data.files ? data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file'
      })) : [];

      responseData = { files: transformedFiles };
    } else if (action === 'getFileContent') {
      // Handle different content types
      const contentType = driveResponse.headers.get('content-type');
      
      if (contentType?.includes('text') || contentType?.includes('json')) {
        const textContent = await driveResponse.text();
        responseData = { content: textContent };
      } else {
        // For binary files, convert to base64
        const arrayBuffer = await driveResponse.arrayBuffer();
        const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        responseData = { contentBase64: base64Content };
      }
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
