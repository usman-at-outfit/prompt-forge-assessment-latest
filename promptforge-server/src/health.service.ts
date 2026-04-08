import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    const usingMongo =
      Boolean(process.env.MONGODB_URI) &&
      !process.env.MONGODB_URI?.includes('username:password');

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      dbStatus: usingMongo ? 'configured' : 'fallback-memory',
    };
  }
}
