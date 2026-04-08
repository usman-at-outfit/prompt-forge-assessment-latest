import { Injectable } from '@nestjs/common';
import { ModelsService } from '../models/models.service';
import { RuntimeMessage, RuntimeStoreService } from '../runtime/runtime-store.service';
import { SessionsService } from '../sessions/sessions.service';
import { TokensService } from '../tokens/tokens.service';
import {
  ExtractedAttachment,
  extractAttachment,
  UploadedChatFile,
} from './chat-file-extractor';

@Injectable()
export class ChatService {
  constructor(
    private readonly runtimeStore: RuntimeStoreService,
    private readonly sessionsService: SessionsService,
    private readonly modelsService: ModelsService,
    private readonly tokensService: TokensService,
  ) {}

  private createMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    modelId: string,
    tokens: number,
  ): RuntimeMessage {
    return {
      id: this.runtimeStore.createId(),
      role,
      content,
      modelId,
      tokens,
      timestamp: this.runtimeStore.now(),
    };
  }

  private generateAssistantReply(content: string, modelName: string) {
    const lower = content.toLowerCase();
    const matchedTemplate = this.runtimeStore.promptTemplates.find(
      (template) =>
        lower.includes(template.useCase.split('-')[0]) ||
        template.tags.some((tag) => lower.includes(tag)),
    );

    if (matchedTemplate) {
      return `${modelName} recommends the "${matchedTemplate.title}" pattern here. Start with a clear objective, include the relevant context, and ask for a structured output so the response is easier to reuse.`;
    }

    return `${modelName} is ready to help. Based on your message, I'd break the task into a short plan, surface the key assumptions, and then produce a practical first draft you can keep iterating on.`;
  }

  private summarizeChunk(text: string) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 35);

    if (sentences.length > 0) {
      return sentences[0];
    }

    return normalized.slice(0, 220);
  }

  private buildUserMessagePreview(content: string, attachments: ExtractedAttachment[]) {
    const previewLines = attachments.map(
      (attachment) =>
        `- ${attachment.name}: ${attachment.extractedText.length} chars across ${Math.max(
          attachment.chunks.length,
          1,
        )} chunk(s)`,
    );

    return [content.trim(), attachments.length ? 'Attachments:' : '', ...previewLines]
      .filter(Boolean)
      .join('\n');
  }

  private buildCombinedAttachmentReply(
    content: string,
    modelName: string,
    attachments: ExtractedAttachment[],
  ) {
    const totalChunks = attachments.reduce(
      (sum, attachment) => sum + Math.max(attachment.chunks.length, 1),
      0,
    );
    const highlights = attachments
      .flatMap((attachment) =>
        attachment.chunks.map((chunk) => ({
          name: attachment.name,
          summary: this.summarizeChunk(chunk),
        })),
      )
      .filter((entry) => entry.summary)
      .slice(0, 8);

    const attachmentLines = attachments.map(
      (attachment) =>
        `- ${attachment.name} (${attachment.mimeType || 'unknown'}): ${attachment.extractedText.length} extracted chars, ${Math.max(
          attachment.chunks.length,
          1,
        )} chunk(s)`,
    );

    const warningLines = attachments.flatMap((attachment) =>
      attachment.warnings.map((warning) => `- ${attachment.name}: ${warning}`),
    );

    const nextStep = this.generateAssistantReply(
      [
        content,
        ...attachments.map((attachment) => attachment.extractedText.slice(0, 600)),
      ]
        .filter(Boolean)
        .join('\n\n'),
      modelName,
    );

    return [
      `${modelName} processed ${attachments.length} uploaded file(s) in ${totalChunks} backend chunk(s) and combined them into one response.`,
      '',
      `Request: ${content.trim() || 'Review the uploaded material and help me work with it.'}`,
      '',
      'Files received:',
      ...attachmentLines,
      '',
      'Combined highlights:',
      ...highlights.map(
        (entry, index) => `${index + 1}. ${entry.name}: ${entry.summary}`,
      ),
      ...(warningLines.length
        ? ['', 'Processing notes:', ...warningLines]
        : []),
      '',
      'Suggested next step:',
      nextStep,
    ].join('\n');
  }

  async sendMessage(body: {
    content: string;
    modelId: string;
    sessionId: string;
    userId?: string | null;
    files?: UploadedChatFile[];
  }) {
    const session = this.sessionsService.getSession(body.sessionId);
    const activeModelId = body.modelId || session.activeModel || 'gpt-4o';
    const model = this.modelsService.getModelById(activeModelId);
    const attachments = await Promise.all(
      (body.files ?? []).map((file) => extractAttachment(file)),
    );
    const normalizedContent = body.content?.trim() ?? '';

    session.activeModel = activeModelId;
    session.modelHistory = Array.from(new Set([...session.modelHistory, activeModelId]));

    const userPreview =
      attachments.length > 0
        ? this.buildUserMessagePreview(
            normalizedContent || 'Uploaded files for analysis.',
            attachments,
          )
        : normalizedContent;
    const inputSource = [
      normalizedContent,
      ...attachments.map(
        (attachment) => `Attachment: ${attachment.name}\n${attachment.extractedText}`,
      ),
    ]
      .filter(Boolean)
      .join('\n\n');

    const inputTokens = this.tokensService.estimateTokens(inputSource);
    const userMessage = this.createMessage('user', userPreview, activeModelId, inputTokens);
    const assistantContent =
      attachments.length > 0
        ? this.buildCombinedAttachmentReply(normalizedContent, model.name, attachments)
        : this.generateAssistantReply(normalizedContent, model.name);
    const outputTokens = this.tokensService.estimateTokens(assistantContent);
    const assistantMessage = this.createMessage(
      'assistant',
      assistantContent,
      activeModelId,
      outputTokens,
    );

    session.chatHistory.push(userMessage, assistantMessage);
    this.runtimeStore.touchSession(session);
    this.tokensService.track({
      agentName: 'Chat Messages',
      actionType: attachments.length > 0 ? 'message-with-files' : 'message',
      inputTokens,
      outputTokens,
      modelId: activeModelId,
      sessionId: session.sessionId,
      userId: body.userId ?? session.userId,
    });

    return { message: assistantMessage };
  }

  switchModel(body: { newModelId: string; sessionId: string }) {
    const session = this.sessionsService.getSession(body.sessionId);
    const model = this.modelsService.getModelById(body.newModelId);
    session.activeModel = model.modelId;
    session.modelHistory = Array.from(new Set([...session.modelHistory, model.modelId]));
    session.chatHistory.push(
      this.createMessage(
        'system',
        `Switched to ${model.name} - History preserved`,
        model.modelId,
        0,
      ),
    );
    this.runtimeStore.touchSession(session);

    return {
      success: true,
      model,
    };
  }

  getHistory(sessionId: string) {
    const session = this.sessionsService.getSession(sessionId);
    return {
      messages: session.chatHistory,
      activeModel: session.activeModel,
      modelHistory: session.modelHistory,
    };
  }

  clearHistory(sessionId: string) {
    const session = this.sessionsService.getSession(sessionId);
    session.chatHistory = [];
    this.runtimeStore.touchSession(session);
    this.runtimeStore.persist();
    return { success: true };
  }
}
