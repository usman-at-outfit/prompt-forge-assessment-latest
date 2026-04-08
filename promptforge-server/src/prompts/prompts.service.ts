import { BadRequestException, Injectable } from '@nestjs/common';
import { RuntimePromptHistory, RuntimeStoreService } from '../runtime/runtime-store.service';
import { SessionsService } from '../sessions/sessions.service';
import { TokensService } from '../tokens/tokens.service';

@Injectable()
export class PromptsService {
  constructor(
    private readonly runtimeStore: RuntimeStoreService,
    private readonly sessionsService: SessionsService,
    private readonly tokensService: TokensService,
  ) {}

  private interpolate(template: string, values: Record<string, unknown>) {
    return template.replace(/{{(.*?)}}/g, (_match, key) => {
      const value = values[key.trim()];
      return typeof value === 'string' ? value : '';
    });
  }

  private experiencePrefix(experience: string) {
    const mapping: Record<string, string> = {
      beginner: 'Explain clearly, use plain language, and avoid jargon unless you define it.',
      experienced: 'Balance clarity with practical detail and include concise rationale.',
      developer: 'Use precise technical language, include implementation details, and surface edge cases.',
      researcher: 'Be rigorous, compare alternatives, and cite evaluation criteria explicitly.',
    };

    return mapping[experience] ?? mapping.beginner;
  }

  private audienceInstructions(audience: string) {
    const mapping: Record<string, string> = {
      'just-me': 'Optimize for a single user executing the result directly.',
      'my-team': 'Structure the output so a team can collaborate on it.',
      'my-company': 'Include governance, rollout, and stakeholder alignment notes.',
      'my-customers': 'Keep the output customer-facing, polished, and trustworthy.',
      students: 'Use examples, gentle scaffolding, and a small self-check section.',
      public: 'Use inclusive, accessible language for a broad audience.',
    };

    return mapping[audience] ?? 'Keep the output clear and easy to act on.';
  }

  private findBestTemplate(answers: Record<string, string>) {
    return (
      this.runtimeStore.promptTemplates.find(
        (template) => template.useCase === answers.useCase,
      ) ?? this.runtimeStore.promptTemplates[0]
    );
  }

  generate(body: {
    answers: {
      useCase: string;
      audience: string;
      experience: string;
      followUp: string;
    };
    sessionId: string;
    userId?: string | null;
  }) {
    const session = this.sessionsService.getSession(body.sessionId);
    const template = this.findBestTemplate(body.answers);
    const rolePrefix = this.experiencePrefix(body.answers.experience);
    const formatInstructions = this.audienceInstructions(body.answers.audience);
    const promptText = [
      `System role: ${template.systemPrompt}`,
      `Guidance: ${rolePrefix}`,
      `Audience instructions: ${formatInstructions}`,
      this.interpolate(template.userPromptTemplate, body.answers),
    ].join('\n\n');
    const estimatedTokens = this.tokensService.estimateTokens(promptText);
    const promptRecord: RuntimePromptHistory = {
      id: this.runtimeStore.createId(),
      promptText,
      modelRecommendations: template.suggestedModels,
      answers: body.answers,
      createdAt: this.runtimeStore.now(),
      estimatedTokens,
      templateUsed: template.title,
    };

    session.promptHistory.unshift(promptRecord);
    this.runtimeStore.touchSession(session);
    this.tokensService.track({
      agentName: 'Prompt Builder',
      actionType: 'generate',
      inputTokens: this.tokensService.estimateTokens(JSON.stringify(body.answers)),
      outputTokens: estimatedTokens,
      modelId: template.suggestedModels[0] ?? session.activeModel,
      sessionId: session.sessionId,
      userId: body.userId ?? session.userId,
    });

    return {
      promptText,
      templateUsed: template.title,
      estimatedTokens,
      suggestedModels: template.suggestedModels,
      promptId: promptRecord.id,
    };
  }

  regenerate(body: {
    promptId?: string;
    sessionId: string;
    userId?: string | null;
    promptText?: string;
    answers?: {
      useCase?: string;
      audience?: string;
      experience?: string;
      followUp?: string;
    };
  }) {
    const session = this.sessionsService.getSession(body.sessionId);
    const prompt =
      (body.promptId
        ? session.promptHistory.find((entry) => entry.id === body.promptId)
        : null) ?? session.promptHistory[0];

    const sourcePromptText = prompt?.promptText ?? body.promptText;

    if (!sourcePromptText) {
      if (
        body.answers?.useCase &&
        body.answers?.audience &&
        body.answers?.experience &&
        body.answers?.followUp
      ) {
        return this.generate({
          answers: {
            useCase: body.answers.useCase,
            audience: body.answers.audience,
            experience: body.answers.experience,
            followUp: body.answers.followUp,
          },
          sessionId: body.sessionId,
          userId: body.userId,
        });
      }

      throw new BadRequestException('No prompt content available to regenerate');
    }

    const promptText = `${sourcePromptText}\n\nRefinement note: tighten the response structure and make the steps slightly more actionable.`;
    const estimatedTokens = this.tokensService.estimateTokens(promptText);
    const regenerated: RuntimePromptHistory = {
      ...(prompt ?? {
        modelRecommendations: [],
        answers: body.answers ?? {},
        templateUsed: 'Refined Prompt',
      }),
      id: this.runtimeStore.createId(),
      promptText,
      estimatedTokens,
      createdAt: this.runtimeStore.now(),
    };

    session.promptHistory.unshift(regenerated);
    this.runtimeStore.touchSession(session);
    this.tokensService.track({
      agentName: 'Prompt Builder',
      actionType: 'regenerate',
      inputTokens:
        prompt?.estimatedTokens ?? this.tokensService.estimateTokens(sourcePromptText),
      outputTokens: estimatedTokens,
      modelId: prompt?.modelRecommendations[0] ?? session.activeModel,
      sessionId: session.sessionId,
      userId: body.userId ?? session.userId,
    });

    return {
      promptText,
      estimatedTokens,
      promptId: regenerated.id,
    };
  }

  update(
    promptId: string,
    body: {
      sessionId: string;
      promptText: string;
      userId?: string | null;
    },
  ) {
    const session = this.sessionsService.getSession(body.sessionId);
    const prompt = session.promptHistory.find((entry) => entry.id === promptId);

    if (!prompt) {
      throw new BadRequestException('Prompt not found');
    }

    const promptText = String(body.promptText ?? '').trim();
    if (!promptText) {
      throw new BadRequestException('Prompt text is required');
    }

    prompt.promptText = promptText;
    prompt.estimatedTokens = this.tokensService.estimateTokens(promptText);
    prompt.createdAt = this.runtimeStore.now();

    this.runtimeStore.touchSession(session);
    this.tokensService.track({
      agentName: 'Prompt Builder',
      actionType: 'edit',
      inputTokens: this.tokensService.estimateTokens(prompt.promptText),
      outputTokens: prompt.estimatedTokens,
      modelId: prompt.modelRecommendations[0] ?? session.activeModel,
      sessionId: session.sessionId,
      userId: body.userId ?? session.userId,
    });

    return {
      promptId: prompt.id,
      promptText: prompt.promptText,
      estimatedTokens: prompt.estimatedTokens,
      suggestedModels: prompt.modelRecommendations,
      templateUsed: prompt.templateUsed,
    };
  }

  getHistory(sessionId: string) {
    return this.sessionsService.getSession(sessionId).promptHistory;
  }

  delete(promptId: string, sessionId: string) {
    const session = this.sessionsService.getSession(sessionId);
    session.promptHistory = session.promptHistory.filter((entry) => entry.id !== promptId);
    this.runtimeStore.touchSession(session);
    this.runtimeStore.persist();
    return { success: true };
  }
}
