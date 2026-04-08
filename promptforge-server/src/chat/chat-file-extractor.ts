import mammoth from 'mammoth';
import { extname } from 'path';
import { PDFParse } from 'pdf-parse';
import WordExtractor from 'word-extractor';

export type UploadedChatFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type ExtractedAttachment = {
  name: string;
  mimeType: string;
  size: number;
  extension: string;
  extractedText: string;
  chunks: string[];
  warnings: string[];
};

const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.scss',
  '.sql',
  '.py',
  '.java',
  '.c',
  '.cpp',
  '.cs',
  '.go',
  '.rs',
  '.php',
  '.rb',
  '.sh',
  '.yaml',
  '.yml',
  '.rtf',
  '.log',
]);

const CHUNK_SIZE = 12000;

function normalizeText(value: string) {
  return value
    .replace(/\u0000/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function isProbablyText(buffer: Buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('utf8');
  if (!sample.trim()) return false;
  const printable = sample.replace(
    /[\u0009\u000A\u000D\u0020-\u007E\u00A0-\u024F]/g,
    '',
  );
  return printable.length / Math.max(sample.length, 1) < 0.12;
}

export function chunkTextContent(text: string, size = CHUNK_SIZE) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= size) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (paragraph.length <= size) {
      current = paragraph;
      continue;
    }

    for (let start = 0; start < paragraph.length; start += size) {
      chunks.push(paragraph.slice(start, start + size));
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function extractPdfText(file: UploadedChatFile) {
  const parser = new PDFParse({ data: file.buffer });

  try {
    const parsed = await parser.getText();
    return normalizeText(parsed.text);
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(file: UploadedChatFile) {
  const result = await mammoth.extractRawText({ buffer: file.buffer });
  return normalizeText(result.value);
}

async function extractLegacyDocText(file: UploadedChatFile) {
  const extractor = new WordExtractor();
  const extracted = await extractor.extract(file.buffer);
  return normalizeText(extracted.getBody());
}

function buildMetadataText(file: UploadedChatFile, kind: string) {
  return `${kind}: ${file.originalname} (${file.mimetype || 'unknown'}, ${formatSize(file.size)})`;
}

export async function extractAttachment(file: UploadedChatFile): Promise<ExtractedAttachment> {
  const extension = extname(file.originalname || '').toLowerCase();
  const mimeType = file.mimetype || 'application/octet-stream';
  const warnings: string[] = [];
  let extractedText = '';

  try {
    if (mimeType.startsWith('image/')) {
      extractedText = buildMetadataText(file, 'Image attachment received');
      warnings.push('Image content is passed as metadata text; OCR is not enabled.');
    } else if (mimeType.startsWith('video/')) {
      extractedText = buildMetadataText(file, 'Video attachment received');
      warnings.push(
        'Video content is passed as metadata text; transcription and frame extraction are not enabled.',
      );
    } else if (mimeType.startsWith('audio/')) {
      extractedText = buildMetadataText(file, 'Audio attachment received');
      warnings.push(
        'Audio content is passed as metadata text; transcription is not enabled for uploaded audio files.',
      );
    } else if (mimeType === 'application/pdf' || extension === '.pdf') {
      extractedText = await extractPdfText(file);
    } else if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === '.docx'
    ) {
      extractedText = await extractDocxText(file);
    } else if (mimeType === 'application/msword' || extension === '.doc') {
      extractedText = await extractLegacyDocText(file);
    } else if (mimeType.startsWith('text/') || TEXT_EXTENSIONS.has(extension)) {
      extractedText = normalizeText(file.buffer.toString('utf8'));
    } else if (isProbablyText(file.buffer)) {
      extractedText = normalizeText(file.buffer.toString('utf8'));
    } else {
      extractedText = buildMetadataText(file, 'Binary attachment received');
      warnings.push(
        'This file type is not directly text-extracted, so it was converted to metadata text.',
      );
    }
  } catch (error) {
    extractedText = buildMetadataText(file, 'Attachment received');
    warnings.push(
      error instanceof Error
        ? `Text extraction fallback used: ${error.message}`
        : 'Text extraction fallback used.',
    );
  }

  if (!extractedText) {
    extractedText = buildMetadataText(file, 'Attachment received');
    warnings.push('No readable text was found, so metadata text was used instead.');
  }

  return {
    name: file.originalname,
    mimeType,
    size: file.size,
    extension,
    extractedText,
    chunks: chunkTextContent(extractedText),
    warnings,
  };
}
