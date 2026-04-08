import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';

  @Prop({
    type: {
      defaultModel: String,
      theme: { type: String, default: 'dark' },
      language: { type: String, default: 'en' },
    },
    default: {},
  })
  preferences!: {
    defaultModel?: string;
    theme: string;
    language: string;
  };

  @Prop({
    type: {
      totalUsed: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
    },
    default: {},
  })
  tokenStats!: {
    totalUsed: number;
    totalCost: number;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
