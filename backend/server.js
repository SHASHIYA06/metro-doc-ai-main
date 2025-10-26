// Enhanced RAG Server for KMRCL — SHASHI SHEKHAR MISHRA
// Features: Advanced Extraction (PDF/IMG/DOCX/XLSX/CSV) → Chunk → Embeddings (Gemini) → Vector DB → Enhanced RAG
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import mammoth from "mammoth";
import cors from "cors";
import dotenv from "dotenv";
import xlsx from "xlsx";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

/* ------------------------------ CORS/JSON ------------------------------ */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://kmrcldocumentsearchgoogledrive.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ------------------------------ Enhanced Globals ------------------------------ */
// Advanced in-memory vector store with metadata
// Each item: { id, fileName, mime, system, subsystem, meta, chunk, embedding: number[], sourceId, position, timestamp, tags }
const VECTOR_STORE = [];
let NEXT_ID = 1;

// Enhanced configuration
const CHUNK_SIZE = 1500;           // Increased for better context
const CHUNK_OVERLAP = 300;         // Increased overlap for continuity
const MAX_SNIPPETS = 15;           // More snippets for comprehensive answers
const MAX_EMBED_TEXT = 8000;       // Increased limit for Gemini
const SIMILARITY_THRESHOLD = 0.7;  // Minimum similarity for results

// Document type handlers
const DOCUMENT_HANDLERS = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/csv': 'csv',
  'text/plain': 'text',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/tiff': 'image',
  'image/bmp': 'image'
};

/* ------------------------------ Enhanced Utilities ------------------------------ */
function ensureEnv() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing in environment.");
  }
}

function readTextSafe(filePath) {
  try { return fs.readFileSync(filePath, "utf8"); } catch { return ""; }
}

function enhancedChunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text) return [];
  
  // Smart chunking: try to break at sentence boundaries
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= size) {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + ".");
        // Add overlap from the end of current chunk
        const words = currentChunk.split(" ");
        const overlapWords = words.slice(-Math.floor(overlap / 10));
        currentChunk = overlapWords.join(" ") + ". " + trimmedSentence;
      } else {
        currentChunk = trimmedSentence;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk + ".");
  }
  
  return chunks.length > 0 ? chunks : [text];
}

function enhancedCosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(na) * Math.sqrt(nb);
  return magnitude > 0 ? dot / magnitude : 0;
}

function extractMetadata(text, fileName) {
  const metadata = {
    wordCount: text.split(/\s+/).length,
    hasNumbers: /\d+/.test(text),
    hasTechnicalTerms: /\b(circuit|voltage|current|control|system|motor|sensor|relay|switch)\b/i.test(text),
    hasWiring: /\b(wire|cable|connection|terminal|pin|connector)\b/i.test(text),
    hasSafety: /\b(safety|emergency|alarm|protection|interlock)\b/i.test(text),
    language: 'en', // Could be enhanced with language detection
    extractedAt: new Date().toISOString()
  };
  
  // Extract potential part numbers
  const partNumbers = text.match(/\b[A-Z]{2,4}[-_]?\d{3,6}[-_]?[A-Z]?\b/g) || [];
  metadata.partNumbers = [...new Set(partNumbers)].slice(0, 10);
  
  // Extract voltage/current specifications
  const voltages = text.match(/\b\d+\.?\d*\s*V(?:DC|AC)?\b/gi) || [];
  const currents = text.match(/\b\d+\.?\d*\s*[mM]?A\b/gi) || [];
  metadata.voltages = [...new Set(voltages)].slice(0, 5);
  metadata.currents = [...new Set(currents)].slice(0, 5);
  
  return metadata;
}

function toCSVTable(rows) {
  if (!rows || !rows.length) return "";
  return rows.map(r => r.map(v => String(v ?? "").replace(/\r?\n/g, " ").trim()).join(",")).join("\n");
}

function looksTabular(text) {
  if (!text) return false;
  const lines = text.split(/\r?\n/).slice(0, 30);
  const commas = lines.map(l => (l.match(/,/g) || []).length);
  const avg = commas.reduce((a,b)=>a+b,0) / Math.max(1, commas.length);
  return avg > 2;
}

/* ------------------------------ Enhanced Extraction ------------------------------ */
async function enhancedExtractText(filePath, mimetype, fileName) {
  try {
    let extractedText = "";
    let metadata = {};
    
    switch (DOCUMENT_HANDLERS[mimetype]) {
      case 'pdf':
        const pdfData = await pdf(fs.readFileSync(filePath));
        extractedText = pdfData.text;
        metadata.pages = pdfData.numpages;
        
        // Fallback OCR for scanned PDFs if text is sparse
        if (extractedText.length < 100) {
          console.log(`PDF appears to be scanned, attempting OCR for ${fileName}`);
          try {
            const ocrResult = await Tesseract.recognize(filePath, "eng", {
              logger: m => console.log(`OCR Progress: ${m.progress * 100}%`)
            });
            extractedText = ocrResult.data.text || extractedText;
            metadata.ocrUsed = true;
          } catch (ocrError) {
            console.warn(`OCR failed for ${fileName}:`, ocrError.message);
          }
        }
        break;
        
      case 'image':
        console.log(`Performing OCR on image: ${fileName}`);
        const ocrResult = await Tesseract.recognize(filePath, "eng", {
          logger: m => console.log(`OCR Progress: ${m.progress * 100}%`)
        });
        extractedText = ocrResult.data.text || "";
        metadata.ocrUsed = true;
        metadata.confidence = ocrResult.data.confidence;
        break;
        
      case 'docx':
        const docxResult = await mammoth.extractRawText({ path: filePath });
        extractedText = docxResult.value || "";
        break;
        
      case 'xlsx':
      case 'xls':
        const workbook = xlsx.readFile(filePath);
        let xlsxText = [];
        workbook.SheetNames.forEach(sheetName => {
          const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true });
          const filtered = sheet.filter(row => row && row.some(c => c !== null && c !== undefined && String(c).trim() !== ""));
          if (filtered.length) {
            xlsxText.push(`Sheet: ${sheetName}\n${toCSVTable(filtered)}`);
          }
        });
        extractedText = xlsxText.join("\n\n");
        metadata.sheets = workbook.SheetNames.length;
        break;
        
      case 'csv':
      case 'text':
        extractedText = readTextSafe(filePath);
        break;
        
      default:
        console.warn(`Unsupported file type: ${mimetype}`);
        extractedText = `Unsupported file type: ${mimetype}`;
    }
    
    // Extract additional metadata
    const enhancedMeta = extractMetadata(extractedText, fileName);
    
    return {
      text: extractedText,
      metadata: { ...metadata, ...enhancedMeta }
    };
    
  } catch (err) {
    console.error(`❌ Enhanced extraction error for ${fileName}:`, err);
    return {
      text: `Error extracting content: ${err.message}`,
      metadata: { error: err.message, extractedAt: new Date().toISOString() }
    };
  }
}

/* ------------------------------ Enhanced Gemini API ------------------------------ */
async function geminiEmbed(text) {
  ensureEnv();
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
  const body = {
    content: { parts: [{ text: text.slice(0, MAX_EMBED_TEXT) }] },
    taskType: "RETRIEVAL_DOCUMENT",
  };
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini embed error ${res.status}: ${raw}`);
  }
  
  const data = JSON.parse(raw);
  return data.embedding?.values || [];
}

async function enhancedGeminiChat(prompt, context = "") {
  ensureEnv();
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const enhancedPrompt = `You are an expert technical analyst for metro railway systems and engineering documentation.

${context ? `CONTEXT:\n${context}\n\n` : ""}

USER QUERY: ${prompt}

INSTRUCTIONS:
- Provide precise, technical answers based on the provided context
- Include specific part numbers, specifications, and technical details when available
- Structure your response with clear sections for better readability
- If discussing wiring or circuits, include safety considerations
- Cite specific sources when referencing technical specifications
- Use professional engineering terminology appropriate for metro systems

RESPONSE FORMAT:
- Use HTML formatting for better presentation
- Include tables for specifications when appropriate
- Use bullet points for lists of components or procedures
- Highlight important safety information
- Provide actionable technical guidance`;

  const body = { 
    contents: [{ parts: [{ text: enhancedPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.8,
      maxOutputTokens: 2048,
    }
  };
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  const raw = await res.text();
  if (!res.ok) throw new Error(`Gemini chat error ${res.status}: ${raw}`);
  
  const data = JSON.parse(raw);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
}

/* ------------------------------ Enhanced Indexing (Ingest) ------------------------------ */
app.post("/ingest", upload.array("files"), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: "No files uploaded" });

    let added = 0;
    const processingResults = [];

    for (const file of req.files) {
      const filePath = file.path;
      const mimetype = file.mimetype || "application/octet-stream";
      const fileName = file.originalname;
      const system = req.body.system || "";
      const subsystem = req.body.subsystem || "";

      console.log(`Processing: ${fileName} (${mimetype})`);

      try {
        // Enhanced extraction with metadata
        const { text: rawText, metadata } = await enhancedExtractText(filePath, mimetype, fileName);
        
        // Cleanup temp file
        fs.unlink(filePath, () => {});

        if (!rawText || rawText.trim().length < 10) {
          console.warn(`Skipping ${fileName}: insufficient content`);
          continue;
        }

        // Enhanced chunking
        const chunks = enhancedChunkText(rawText);
        console.log(`Created ${chunks.length} chunks for ${fileName}`);

        // Process each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          try {
            const embedding = await geminiEmbed(chunk);
            
            if (embedding.length === 0) {
              console.warn(`Empty embedding for chunk ${i} of ${fileName}`);
              continue;
            }

            VECTOR_STORE.push({
              id: NEXT_ID++,
              fileName,
              mime: mimetype,
              system,
              subsystem,
              meta: {
                ...metadata,
                chunkIndex: i,
                totalChunks: chunks.length,
                chunkSize: chunk.length
              },
              chunk,
              embedding,
              sourceId: fileName,
              position: i,
              timestamp: new Date().toISOString(),
              tags: extractTags(chunk)
            });
            
            added++;
          } catch (embeddingError) {
            console.error(`Embedding error for chunk ${i} of ${fileName}:`, embeddingError.message);
          }
        }

        processingResults.push({
          fileName,
          status: 'success',
          chunks: chunks.length,
          metadata
        });

      } catch (fileError) {
        console.error(`File processing error for ${fileName}:`, fileError);
        processingResults.push({
          fileName,
          status: 'error',
          error: fileError.message
        });
        
        // Cleanup temp file on error
        fs.unlink(filePath, () => {});
      }
    }

    res.json({ 
      ok: true, 
      added, 
      total: VECTOR_STORE.length,
      results: processingResults
    });

  } catch (err) {
    console.error("❌ /ingest error:", err);
    res.status(500).json({ error: err.message });
  }
});

function extractTags(text) {
  const tags = [];
  
  // Technical system tags
  if (/\b(door|gate|barrier)\b/i.test(text)) tags.push('doors');
  if (/\b(hvac|ventilation|air.?conditioning|climate)\b/i.test(text)) tags.push('hvac');
  if (/\b(traction|motor|drive|propulsion)\b/i.test(text)) tags.push('traction');
  if (/\b(brake|braking|emergency.?stop)\b/i.test(text)) tags.push('braking');
  if (/\b(signal|communication|radio|antenna)\b/i.test(text)) tags.push('signaling');
  if (/\b(power|electrical|voltage|current)\b/i.test(text)) tags.push('electrical');
  if (/\b(safety|protection|interlock|emergency)\b/i.test(text)) tags.push('safety');
  if (/\b(control|controller|cpu|plc)\b/i.test(text)) tags.push('control');
  
  // Component tags
  if (/\b(relay|contactor|switch)\b/i.test(text)) tags.push('components');
  if (/\b(sensor|detector|monitor)\b/i.test(text)) tags.push('sensors');
  if (/\b(wire|cable|harness|connector)\b/i.test(text)) tags.push('wiring');
  if (/\b(maintenance|service|repair|inspection)\b/i.test(text)) tags.push('maintenance');
  
  return tags;
}

/* ------------------------------ Enhanced RAG Search ------------------------------ */
app.post("/ask", async (req, res) => {
  try {
    const { query, k = MAX_SNIPPETS, system = "", subsystem = "", tags = [] } = req.body;
    
    if (!query) return res.status(400).json({ error: "Missing query" });
    if (VECTOR_STORE.length === 0) return res.status(400).json({ error: "Index is empty. Ingest files first." });

    console.log(`Enhanced RAG query: "${query}" with ${VECTOR_STORE.length} indexed chunks`);

    // Embed query
    const qEmb = await geminiEmbed(query);

    // Enhanced filtering
    const candidates = VECTOR_STORE.filter(x => {
      const sysOk = system ? (x.system || "").toLowerCase().includes(system.toLowerCase()) : true;
      const subOk = subsystem ? (x.subsystem || "").toLowerCase().includes(subsystem.toLowerCase()) : true;
      const tagOk = tags.length === 0 || tags.some(tag => x.tags?.includes(tag));
      return sysOk && subOk && tagOk;
    });

    console.log(`Filtered to ${candidates.length} candidates`);

    // Enhanced scoring with multiple factors
    const scored = candidates.map(c => {
      const cosineSim = enhancedCosineSim(qEmb, c.embedding);
      
      // Boost score based on metadata
      let boost = 1.0;
      if (c.meta?.hasTechnicalTerms) boost += 0.1;
      if (c.meta?.hasWiring && /wir|cable|connect/i.test(query)) boost += 0.15;
      if (c.meta?.hasSafety && /safety|emergency/i.test(query)) boost += 0.15;
      if (c.meta?.partNumbers?.length > 0) boost += 0.05;
      
      // Recency boost (newer documents get slight preference)
      const age = Date.now() - new Date(c.timestamp).getTime();
      const daysSinceIndexed = age / (1000 * 60 * 60 * 24);
      if (daysSinceIndexed < 7) boost += 0.05;
      
      return { 
        ...c, 
        score: cosineSim * boost,
        rawScore: cosineSim,
        boost
      };
    })
    .filter(c => c.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

    console.log(`Found ${scored.length} relevant chunks above threshold`);

    if (scored.length === 0) {
      return res.json({
        result: "No relevant documents found for your query. Try using different keywords or check if documents have been properly indexed.",
        sources: [],
        used: 0,
        totalIndexed: VECTOR_STORE.length,
        query,
        threshold: SIMILARITY_THRESHOLD
      });
    }

    // Build enhanced context
    const contextBlocks = scored.map((c, idx) => {
      const metadata = c.meta || {};
      const metaInfo = [];
      
      if (metadata.partNumbers?.length) metaInfo.push(`Parts: ${metadata.partNumbers.join(', ')}`);
      if (metadata.voltages?.length) metaInfo.push(`Voltages: ${metadata.voltages.join(', ')}`);
      if (metadata.currents?.length) metaInfo.push(`Currents: ${metadata.currents.join(', ')}`);
      
      return `[[${idx+1}]] File: ${c.fileName} (${c.system}/${c.subsystem}) - Chunk ${c.position + 1}/${c.meta?.totalChunks || '?'}
${metaInfo.length ? `Metadata: ${metaInfo.join(' | ')}\n` : ''}Content: ${c.chunk}`;
    }).join("\n\n---\n\n");

    // Determine if response should be HTML formatted
    const hasTabular = scored.some(s => looksTabular(s.chunk) || s.meta?.sheets > 0);
    const queryWantsTable = /table|matrix|list|compare|specification/i.test(query);

    // Enhanced prompt for better responses
    const enhancedAnswer = await enhancedGeminiChat(query, contextBlocks);

    // Build sources with enhanced metadata
    const sources = scored.map((s, i) => ({
      ref: i + 1,
      fileName: s.fileName,
      system: s.system,
      subsystem: s.subsystem,
      position: s.position,
      score: Number(s.score.toFixed(4)),
      rawScore: Number(s.rawScore.toFixed(4)),
      boost: Number(s.boost.toFixed(2)),
      preview: s.chunk.slice(0, 300) + (s.chunk.length > 300 ? "…" : ""),
      metadata: {
        wordCount: s.meta?.wordCount || 0,
        partNumbers: s.meta?.partNumbers || [],
        voltages: s.meta?.voltages || [],
        currents: s.meta?.currents || [],
        tags: s.tags || []
      },
      timestamp: s.timestamp
    }));

    res.json({
      result: enhancedAnswer,
      sources,
      used: scored.length,
      totalIndexed: VECTOR_STORE.length,
      query,
      threshold: SIMILARITY_THRESHOLD,
      result_format: hasTabular || queryWantsTable ? "html" : "auto",
      has_tabular: hasTabular,
      processing_time: Date.now() - Date.now() // Would need to track start time
    });

  } catch (err) {
    console.error("❌ Enhanced /ask error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------ Compatibility & Additional Endpoints ------------------------------ */
// Keep existing endpoints for backward compatibility
app.post("/summarize-multi", async (req, res) => {
  try {
    const { query, files } = req.body;
    if (!query || !files?.length) {
      return res.status(400).json({ error: "Missing query or files" });
    }

    // Convert to ask format
    const askRes = await fetch(`http://localhost:${process.env.PORT || 3000}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, k: MAX_SNIPPETS })
    });

    const data = await askRes.json();
    return res.json(data);
  } catch (err) {
    console.error("❌ /summarize-multi error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/search-multi", async (req, res) => {
  try {
    const { keyword, system, subsystem } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: "Missing keyword" });
    }

    const askRes = await fetch(`http://localhost:${process.env.PORT || 3000}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: keyword, 
        system: system || "",
        subsystem: subsystem || "",
        k: MAX_SNIPPETS 
      })
    });

    const data = await askRes.json();
    return res.json(data);
  } catch (err) {
    console.error("❌ /search-multi error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Clear the enhanced index
app.post("/clear", (req, res) => {
  VECTOR_STORE.length = 0;
  NEXT_ID = 1;
  res.json({ ok: true, total: 0, message: "Enhanced vector store cleared" });
});

/* ------------------------------ Enhanced Diagnostics ------------------------------ */
app.get("/health", (req, res) => {
  const stats = {
    ok: true,
    indexed: VECTOR_STORE.length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  res.json(stats);
});

app.get("/stats", (req, res) => {
  const byFile = {};
  const bySystem = {};
  const bySubsystem = {};
  const byMimeType = {};
  const tagCounts = {};
  
  VECTOR_STORE.forEach(v => {
    byFile[v.fileName] = (byFile[v.fileName] || 0) + 1;
    bySystem[v.system || 'Unknown'] = (bySystem[v.system || 'Unknown'] || 0) + 1;
    bySubsystem[v.subsystem || 'Unknown'] = (bySubsystem[v.subsystem || 'Unknown'] || 0) + 1;
    byMimeType[v.mime] = (byMimeType[v.mime] || 0) + 1;
    
    (v.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  res.json({ 
    totalChunks: VECTOR_STORE.length,
    uniqueFiles: Object.keys(byFile).length,
    byFile,
    bySystem,
    bySubsystem,
    byMimeType,
    tagCounts,
    averageChunkSize: VECTOR_STORE.length > 0 
      ? Math.round(VECTOR_STORE.reduce((sum, v) => sum + v.chunk.length, 0) / VECTOR_STORE.length)
      : 0
  });
});

// Search by tags
app.post("/search-by-tags", async (req, res) => {
  try {
    const { tags, query = "Analyze documents with these tags" } = req.body;
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: "Missing or invalid tags array" });
    }

    const askRes = await fetch(`http://localhost:${process.env.PORT || 3000}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, tags, k: MAX_SNIPPETS })
    });

    const data = await askRes.json();
    return res.json(data);
  } catch (err) {
    console.error("❌ /search-by-tags error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Root endpoint for health check
app.get("/", (req, res) => {
  res.json({
    name: "KMRCL Metro Document Intelligence Backend",
    version: "2.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      ingest: "/ingest",
      ask: "/ask",
      stats: "/stats"
    },
    author: "SHASHI SHEKHAR MISHRA"
  });
});

/* ------------------------------ Server Startup ------------------------------ */
const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Enhanced KMRCL RAG Server running on http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Features: Advanced extraction, enhanced chunking, metadata extraction, tag-based search`);
  console.log(`🔧 Chunk size: ${CHUNK_SIZE}, Overlap: ${CHUNK_OVERLAP}, Max snippets: ${MAX_SNIPPETS}`);
  console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
  }
});