import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ModelDocument = HydratedDocument<ModelEntity>;

@Schema({ timestamps: true })
export class ModelEntity {
  @Prop({ required: true, unique: true })
  modelId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  lab!: string;

  @Prop({ required: true })
  labIcon!: string;

  @Prop({ type: [String], default: [] })
  category!: string[];

  @Prop({ required: true })
  contextWindow!: number;

  @Prop({ required: true })
  inputPricePer1M!: number;

  @Prop({ required: true })
  outputPricePer1M!: number;

  @Prop({ default: false })
  isFree!: boolean;

  @Prop({ default: false })
  isOpenSource!: boolean;

  @Prop({ default: 'Commercial' })
  license!: string;

  @Prop({ default: false })
  multimodal!: boolean;

  @Prop({ required: true })
  speed!: 'fast' | 'medium' | 'slow';

  @Prop({ type: [String], default: [] })
  bestFor!: string[];

  @Prop({ required: true })
  rating!: number;

  @Prop({ required: true })
  reviewCount!: number;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [String], default: [] })
  useCases!: string[];

  @Prop({ type: Object, default: {} })
  benchmarks!: Record<string, number>;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: true })
  isLive!: boolean;

  @Prop({ default: false })
  isFeatured!: boolean;

  @Prop({ default: false })
  isTrending!: boolean;
}

export const ModelSchema = SchemaFactory.createForClass(ModelEntity);
