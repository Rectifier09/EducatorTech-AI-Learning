export interface GenerateInput {
  system: string;
  user: string;
  maxTokens?: number;
}

export type Provider = "gemini" | "groq";

export interface GenerateResult {
  text: string;
  provider: Provider;
}

export interface ModelAdapter {
  name: Provider;
  generate(input: GenerateInput): Promise<GenerateResult>;
}

export type AiErrorCode = "rate_limited" | "provider_error" | "empty";

export class AiError extends Error {
  code: AiErrorCode;
  constructor(code: AiErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "AiError";
  }
}
