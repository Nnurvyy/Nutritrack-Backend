export interface GroqRequest {
  query: string;
}

export interface GeminiRequest {
  image: string; // base64 string
  mimeType: string; // e.g. "image/jpeg"
}

export interface CloudinaryRequest {
  file: any; // could be File or base64 data URI string
  folder?: string;
}
