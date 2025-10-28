// Enhanced LLM Service for KMRCL Metro Document Intelligence
// Supports multiple LLM providers with advanced RAG capabilities

import { config } from '../config/environment';

export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'local';
  model: string;
  apiKey?: string;
  baseURL?: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  confidence: number;
  processingTime: number;
}

export interface RAGContext {
  documents: Array<{
    title: string;
    content: string;
    metadata: Record<string, any>;
    score: number;
  }>;
  query: string;
  searchType: string;
}

class LLMService {
  private configs: Map<string, LLMConfig>;
  private defaultProvider: string;

  constructor() {
    this.configs = new Map();
    this.defaultProvider = 'gemini';
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // Gemini Configuration
    this.configs.set('gemini', {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      temperature: 0.3,
      maxTokens: 2048
    });

    // OpenAI Configuration
    this.configs.set('openai', {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
      temperature: 0.3,
      maxTokens: 2048
    });

    // Claude Configuration
    this.configs.set('claude', {
      provider: 'claude',
      model: 'claude-3-sonnet-20240229',
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      baseURL: 'https://api.anthropic.com/v1',
      temperature: 0.3,
      maxTokens: 2048
    });

    // Local LLM Configuration (for MCP integration)
    this.configs.set('local', {
      provider: 'local',
      model: 'llama-3.1-8b',
      baseURL: 'http://localhost:11434/v1',
      temperature: 0.3,
      maxTokens: 2048
    });
  }

  // Generate enhanced response with RAG context
  async generateResponse(
    ragContext: RAGContext,
    provider: string = this.defaultProvider
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const config = this.configs.get(provider);
    
    if (!config) {
      throw new Error(`LLM provider '${provider}' not configured`);
    }

    try {
      const prompt = this.buildEnhancedPrompt(ragContext);
      let response: LLMResponse;

      switch (config.provider) {
        case 'gemini':
          response = await this.callGemini(prompt, config);
          break;
        case 'openai':
          response = await this.callOpenAI(prompt, config);
          break;
        case 'claude':
          response = await this.callClaude(prompt, config);
          break;
        case 'local':
          response = await this.callLocalLLM(prompt, config);
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${config.provider}`);
      }

      response.processingTime = Date.now() - startTime;
      return response;

    } catch (error) {
      console.error(`LLM ${provider} failed:`, error);
      
      // Fallback to next available provider
      if (provider !== 'gemini') {
        console.log('Falling back to Gemini...');
        return this.generateResponse(ragContext, 'gemini');
      }
      
      throw new Error(`All LLM providers failed: ${error.message}`);
    }
  }

  // Build enhanced prompt with RAG context
  private buildEnhancedPrompt(ragContext: RAGContext): string {
    const { documents, query, searchType } = ragContext;
    
    const contextDocs = documents
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((doc, index) => `
[Document ${index + 1}] ${doc.title}
Relevance Score: ${Math.round(doc.score * 100)}%
Content: ${doc.content}
Metadata: ${JSON.stringify(doc.metadata, null, 2)}
---`).join('\n');

    return `You are an expert technical analyst for metro railway systems and engineering documentation. You have access to relevant documents and must provide precise, actionable responses.

SEARCH TYPE: ${searchType.toUpperCase()}
USER QUERY: ${query}

RELEVANT DOCUMENTS:
${contextDocs}

INSTRUCTIONS:
- Provide a comprehensive technical analysis based on the provided documents
- Include specific part numbers, specifications, and technical details when available
- Structure your response with clear sections for better readability
- If discussing wiring or circuits, include safety considerations
- Cite specific sources when referencing technical specifications
- Use professional engineering terminology appropriate for metro systems
- If the documents don't contain sufficient information, clearly state what's missing

RESPONSE FORMAT:
- Use clear headings and bullet points
- Include tables for specifications when appropriate
- Highlight important safety information
- Provide actionable technical guidance
- Reference specific document sources

SAFETY PRIORITY: Always prioritize safety considerations in metro railway systems.

Please provide your analysis:`;
  }

  // Gemini API call
  private async callGemini(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    const url = `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config.temperature,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: config.maxTokens,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    
    return {
      content,
      model: config.model,
      usage: {
        promptTokens: prompt.length / 4, // Rough estimate
        completionTokens: content.length / 4,
        totalTokens: (prompt.length + content.length) / 4
      },
      confidence: 0.85,
      processingTime: 0
    };
  }

  // OpenAI API call
  private async callOpenAI(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    const url = `${config.baseURL}/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';
    
    return {
      content,
      model: config.model,
      usage: data.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      confidence: 0.9,
      processingTime: 0
    };
  }

  // Claude API call
  private async callClaude(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    const url = `${config.baseURL}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || 'No response generated';
    
    return {
      content,
      model: config.model,
      usage: data.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      confidence: 0.88,
      processingTime: 0
    };
  }

  // Local LLM call (for MCP integration)
  private async callLocalLLM(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    const url = `${config.baseURL}/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local LLM error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';
    
    return {
      content,
      model: config.model,
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: content.length / 4,
        totalTokens: (prompt.length + content.length) / 4
      },
      confidence: 0.8,
      processingTime: 0
    };
  }

  // Get available providers
  getAvailableProviders(): string[] {
    return Array.from(this.configs.keys());
  }

  // Set default provider
  setDefaultProvider(provider: string): void {
    if (this.configs.has(provider)) {
      this.defaultProvider = provider;
    } else {
      throw new Error(`Provider '${provider}' not available`);
    }
  }

  // Test provider connectivity
  async testProvider(provider: string): Promise<boolean> {
    try {
      const testContext: RAGContext = {
        documents: [{
          title: 'Test Document',
          content: 'This is a test document for connectivity check.',
          metadata: { test: true },
          score: 1.0
        }],
        query: 'Test connectivity',
        searchType: 'test'
      };

      await this.generateResponse(testContext, provider);
      return true;
    } catch (error) {
      console.error(`Provider ${provider} test failed:`, error);
      return false;
    }
  }

  // Enhanced analysis with multiple providers (ensemble approach)
  async generateEnsembleResponse(ragContext: RAGContext): Promise<LLMResponse> {
    const providers = ['gemini', 'openai', 'claude'].filter(p => this.configs.has(p));
    const responses: LLMResponse[] = [];

    // Get responses from multiple providers
    for (const provider of providers.slice(0, 2)) { // Limit to 2 for cost efficiency
      try {
        const response = await this.generateResponse(ragContext, provider);
        responses.push(response);
      } catch (error) {
        console.warn(`Provider ${provider} failed in ensemble:`, error);
      }
    }

    if (responses.length === 0) {
      throw new Error('All providers failed in ensemble approach');
    }

    // Combine responses intelligently
    const combinedContent = this.combineResponses(responses, ragContext);
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    const totalProcessingTime = responses.reduce((sum, r) => sum + r.processingTime, 0);

    return {
      content: combinedContent,
      model: `ensemble-${responses.map(r => r.model).join('+')}`,
      usage: {
        promptTokens: Math.max(...responses.map(r => r.usage.promptTokens)),
        completionTokens: responses.reduce((sum, r) => sum + r.usage.completionTokens, 0),
        totalTokens: responses.reduce((sum, r) => sum + r.usage.totalTokens, 0)
      },
      confidence: Math.min(0.95, avgConfidence + 0.1), // Ensemble bonus
      processingTime: totalProcessingTime
    };
  }

  // Combine multiple LLM responses intelligently
  private combineResponses(responses: LLMResponse[], ragContext: RAGContext): string {
    if (responses.length === 1) {
      return responses[0].content;
    }

    // Create a combined response that leverages the best of each
    const header = `# Enhanced AI Analysis - Multi-LLM Ensemble Response

**Query:** ${ragContext.query}
**Search Type:** ${ragContext.searchType}
**Models Used:** ${responses.map(r => r.model).join(', ')}
**Combined Confidence:** ${Math.round(responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length * 100)}%

---

`;

    const combinedAnalysis = responses.map((response, index) => `
## Analysis ${index + 1} - ${response.model}
**Confidence:** ${Math.round(response.confidence * 100)}%

${response.content}

---
`).join('\n');

    const footer = `
## Ensemble Summary

This response combines insights from multiple AI models to provide comprehensive analysis. Each model contributes unique perspectives while maintaining technical accuracy and safety considerations for metro railway systems.

**Processing Details:**
- Total Processing Time: ${responses.reduce((sum, r) => sum + r.processingTime, 0)}ms
- Total Tokens Used: ${responses.reduce((sum, r) => sum + r.usage.totalTokens, 0)}
- Documents Analyzed: ${ragContext.documents.length}
`;

    return header + combinedAnalysis + footer;
  }
}

// Export singleton instance
export const llmService = new LLMService();

// Export for testing or custom instances
export { LLMService };