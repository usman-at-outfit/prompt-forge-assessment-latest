import { Global, Module } from '@nestjs/common';
import { RuntimeStoreService } from './runtime-store.service';

@Global()
@Module({
  providers: [RuntimeStoreService],
  exports: [RuntimeStoreService],
})
export class RuntimeModule {}
