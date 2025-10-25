// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Deno types
declare global {
  interface Window {
    Deno: any;
  }
}

const Deno = window.Deno;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Provided by the user
const MAIN_FOLDER_ID = '1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';

// Helper utilities to robustly parse Apps Script output
function isFileLikeEntry(obj: any) {
  if (!obj || typeof obj !== 'object') return false;
  const keys = Object.keys(obj);
  const hasId = 'id' in obj || 'fileId' in obj || 'file_id' in obj;
  const hasName = 'name' in obj || 'title' in obj;
  return hasId || hasName || keys.includes('mimeType') || keys.includes('mime_type');
}

function deepFindArrayOfFiles(input: any): any[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    if (input.length && typeof input[0] === 'object') return input as any[];
    return [];
  }
  if (typeof input !== 'object') return [];
  // Try common keys first
  const preferredKeys = ['files', 'items', 'data', 'result', 'list', 'entries', 'driveFiles', 'drive_files'];
  for (const key of preferredKeys) {
    if (key in input) {
      const arr = deepFindArrayOfFiles((input as any)[key]);
      if (arr.length) return arr;
    }
  }
  // BFS over object values
  const queue: any[] = Object.values(input as any);
  while (queue.length) {
    const node = queue.shift();
    if (Array.isArray(node)) {
      if (node.length && typeof node[0] === 'object') return node;
    } else if (node && typeof node === 'object') {
      queue.push(...Object.values(node));
    }
  }
  return [];
}

function mapToDriveFile(f: any) {
  const id = f.id || f.fileId || f.file_id || f.gid || f.resourceId || '';
  const name = f.name || f.title || f.fileName || f.filename || 'Untitled';
  const mimeType = f.mimeType || f.mime_type || f.type || '';
  const size = String(f.size || f.fileSize || f.bytes || '');
  const modifiedTime = f.modifiedTime || f.modified_time || f.updated || f.modified || null;
  const type = (String(mimeType).toLowerCase().includes('folder') || f.isFolder || f.folder)
    ? 'folder'
    : 'file';
  return { id, name, mimeType: mimeType || 'application/octet-stream', size, modifiedTime, type };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' },
    });
  }
  try {
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = url.searchParams.get('action') || body.action || 'listFiles';
    const folderId = url.searchParams.get('folderId') || body.folderId || MAIN_FOLDER_ID;
    const debug = url.searchParams.get('debug') === '1' || body.debug === true;

    if (action !== 'listFiles') {
      return new Response(JSON.stringify({ error: 'Only listFiles action is supported via Apps Script proxy' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Attempt GET first (include action for compatibility with certain scripts)
    const getUrl = `${APPS_SCRIPT_URL}?folderId=${encodeURIComponent(folderId)}&action=${encodeURIComponent(action)}`;
    console.log('Apps Script GET:', getUrl);
    let gsResponse = await fetch(getUrl, { method: 'GET' });
    let rawText = await gsResponse.text();
    if (debug) console.log('Apps Script GET raw (first 1k):', rawText.slice(0, 1000));

    // If GET failed or returned empty/invalid, try POST (include action too)
    if (!gsResponse.ok || rawText.trim() === '' || rawText.trim() === '[]' || rawText.trim() === '{}') {
      console.warn('Apps Script GET empty/non-OK, retrying with POST');
      gsResponse = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, action }),
      });
      rawText = await gsResponse.text();
      if (debug) console.log('Apps Script POST raw (first 1k):', rawText.slice(0, 1000));
    }

    if (!gsResponse.ok) {
      console.error('Apps Script bad status:', gsResponse.status, rawText);
      throw new Error(`Apps Script error ${gsResponse.status}: ${rawText}`);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.warn('Apps Script returned non-JSON; attempting to wrap as text array');
      parsed = { files: [] };
    }

    const candidates = deepFindArrayOfFiles(parsed);
    const transformed = candidates.filter((x: any) => isFileLikeEntry(x)).map(mapToDriveFile);

    if (debug) {
      console.log('Transformed count:', transformed.length, 'keys:', Object.keys(parsed));
    }

    return new Response(JSON.stringify(transformed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('google-apps-script-proxy error:', error?.message || error);
    return new Response(JSON.stringify({ error: String(error?.message || error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
