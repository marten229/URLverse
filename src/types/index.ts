export interface URLParameters {
  [key: string]: string;
}

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export interface SlugData {
  slugArray: string[];
  query: string;
  params: URLParameters;
}

export interface PageGenerationResult {
  content: string;
  error?: string;
}
