declare module 'word-extractor' {
  class ExtractedWordDocument {
    getBody(): string;
    getFootnotes(): string;
    getEndnotes(): string;
    getHeaders(options?: Record<string, unknown>): string;
    getFooters(): string;
    getAnnotations(): string;
    getTextboxes(options?: Record<string, unknown>): string;
  }

  export default class WordExtractor {
    extract(source: string | Buffer): Promise<ExtractedWordDocument>;
  }
}
