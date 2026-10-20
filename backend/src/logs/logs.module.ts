import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerService } from './logger.service';
import { RequestContextMiddleware } from './request-context.middleware';
import { AuditoriaInterceptor } from './auditoria.interceptor';

@Global()
@Module({
  providers: [
    LoggerService,
    AuditoriaInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
  exports: [LoggerService, AuditoriaInterceptor],
})
export class LogsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
