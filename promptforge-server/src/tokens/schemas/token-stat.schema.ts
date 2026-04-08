import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TokenStatDocument = HydratedDocument<TokenStat>;

@Schema({ timestamps: { createdAt: 'timestamp', updatedAt: false } })
export class TokenStat {
  @Prop({ required: true })
  sessionId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId!: Types.ObjectId | null;

  @Prop({ required: true })
  agentName!: string;

  @Prop({ required: true })
  actionType!: string;

  @Prop({ required: true })
  inputTokens!: number;

  @Prop({ required: true })
  outputTokens!: number;

  @Prop({ required: true })
  totalTokens!: number;

  @Prop({ required: true })
  estimatedCostUSD!: number;

  @Prop({ required: true })
  modelId!: string;
}

export const TokenStatSchema = SchemaFactory.createForClass(TokenStat);
