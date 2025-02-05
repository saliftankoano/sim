import { ToolConfig, ToolResponse } from '../types'

export interface ReadUrlParams {
  url: string
  useReaderLMv2?: boolean
  gatherLinks?: boolean
  jsonResponse?: boolean
  apiKey?: string
}

export interface ReadUrlResponse extends ToolResponse {
  output: {
    content: string
  }
}

export const readUrlTool: ToolConfig<ReadUrlParams, ReadUrlResponse> = {
  id: 'jina_readurl',
  name: 'Jina Reader',
  description: 'Convert any URL to LLM-friendly text using Jina AI Reader',
  version: '1.0.0',

  params: {
    url: {
      type: 'string',
      required: true,
      description: 'The URL to read and convert to markdown'
    },
    useReaderLMv2: {
      type: 'boolean',
      description: 'Whether to use ReaderLM-v2 for better quality'
    },
    gatherLinks: {
      type: 'boolean',
      description: 'Whether to gather all links at the end'
    },
    jsonResponse: {
      type: 'boolean',
      description: 'Whether to return response in JSON format'
    },
    apiKey: {
      type: 'string',
      description: 'Your Jina AI API key'
    }
  },

  request: {
    url: (params: ReadUrlParams) => {
      return `https://r.jina.ai/https://${params.url.replace(/^https?:\/\//, '')}`
    },
    method: 'GET',
    headers: (params: ReadUrlParams) => {
      // Start with base headers
      const headers: Record<string, string> = {
        'Accept': params.jsonResponse ? 'application/json' : 'text/plain',
        'Authorization': `Bearer ${params.apiKey}`
      }

      // Add conditional headers based on boolean values
      if (params.useReaderLMv2 === true) {
        headers['X-Respond-With'] = 'readerlm-v2'
      }
      if (params.gatherLinks === true) {
        headers['X-With-Links-Summary'] = 'true'
      }

      return headers
    }
  },

  transformResponse: async (response: Response) => {
    const content = await response.text()
    return {
      success: response.ok,
      output: {
        content
      }
    }
  },

  transformError: (error) => {
    return error instanceof Error ? error.message : 'Failed to read URL'
  }
} 
