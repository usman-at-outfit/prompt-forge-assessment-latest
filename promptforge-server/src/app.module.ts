import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { DiscoverModule } from './discover/discover.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { ModelsModule } from './models/models.module';
import { PromptsModule } from './prompts/prompts.module';
import { RuntimeModule } from './runtime/runtime.module';
import { SessionsModule } from './sessions/sessions.module';
import { TokensModule } from './tokens/tokens.module';
import { UsersModule } from './users/users.module';

const shouldUseMongo =
  Boolean(process.env.MONGODB_URI) &&
  !process.env.MONGODB_URI?.includes('username:password');

const mongooseImports = shouldUseMongo
  ? [MongooseModule.forRoot(process.env.MONGODB_URI as string)]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ScheduleModule.forRoot(),
    JwtModule.register({}),
    RuntimeModule,
    UsersModule,
    AuthModule,
    SessionsModule,
    ModelsModule,
    PromptsModule,
    ChatModule,
    TokensModule,
    AgentsModule,
    DiscoverModule,
    ...mongooseImports,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
