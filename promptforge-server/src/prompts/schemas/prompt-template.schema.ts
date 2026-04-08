import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PromptTemplateDocument = HydratedDocument<PromptTemplate>;

@Schema({ timestamps: true })
export class PromptTemplate {
  @Prop({ required: true, unique: true })
  templateId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true })
  useCase!: string;

  @Prop({ required: true })
  audienceLevel!: string;

  @Prop({ required: true })
  systemPrompt!: string;

  @Prop({ required: true })
  userPromptTemplate!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  suggestedModels!: string[];
}

export const PromptTemplateSchema = SchemaFactory.createForClass(PromptTemplate);
