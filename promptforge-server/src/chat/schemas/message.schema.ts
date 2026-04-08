import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<MessageEntity>;

@Schema({ timestamps: { createdAt: 'timestamp', updatedAt: false } })
export class MessageEntity {
  @Prop({ required: true })
  sessionId!: string;

  @Prop({ required: true })
  role!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  modelId!: string;

  @Prop({ required: true })
  tokens!: number;
}

export const MessageSchema = SchemaFactory.createForClass(MessageEntity);
