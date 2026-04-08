import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ _id: false })
class ChatHistoryItem {
  @Prop({ required: true })
  role!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  modelId!: string;

  @Prop({ required: true })
  tokens!: number;

  @Prop({ default: Date.now })
  timestamp!: Date;
}

@Schema({ _id: false })
class PromptHistoryItem {
  @Prop({ required: true })
  promptText!: string;

  @Prop({ type: [String], default: [] })
  modelRecommendations!: string[];

  @Prop({ type: Object, default: {} })
  answers!: Record<string, unknown>;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Session {
  @Prop({ required: true, unique: true })
  sessionId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId!: Types.ObjectId | null;

  @Prop({ default: true })
  isGuest!: boolean;

  @Prop({ type: [ChatHistoryItem], default: [] })
  chatHistory!: ChatHistoryItem[];

  @Prop({ type: [PromptHistoryItem], default: [] })
  promptHistory!: PromptHistoryItem[];

  @Prop({ default: null })
  activeModel!: string | null;

  @Prop({ type: [String], default: [] })
  modelHistory!: string[];

  @Prop({ required: true })
  expiresAt!: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
