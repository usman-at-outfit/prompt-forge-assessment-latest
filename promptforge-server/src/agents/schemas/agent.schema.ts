import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AgentDocument = HydratedDocument<AgentEntity>;

@Schema({ timestamps: true })
export class AgentEntity {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  ownerId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  templateId?: string;

  @Prop({ required: true })
  modelId!: string;

  @Prop({ required: true })
  systemPrompt!: string;

  @Prop()
  description?: string;

  @Prop()
  agentType?: string;

  @Prop()
  mainJob?: string;

  @Prop()
  audience?: string;

  @Prop()
  tone?: string;

  @Prop()
  avoid?: string;

  @Prop()
  notes?: string;

  @Prop({ type: [String], default: [] })
  tools!: string[];

  @Prop({ default: 'none' })
  memoryType!: string;

  @Prop({ type: [String], default: [] })
  testScenarios!: string[];

  @Prop({ type: [String], default: [] })
  customScenarios!: string[];

  @Prop({ default: 'api-endpoint' })
  deployTarget!: string;

  @Prop({ default: 'draft' })
  status!: string;

  @Prop()
  summary?: string;

  @Prop()
  greeting?: string;
}

export const AgentSchema = SchemaFactory.createForClass(AgentEntity);
