import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database/data-source';
import { AuthModule } from './auth/auth.module';
import { AcessoModule } from './acesso/acesso.module';

@Module({
  imports: [TypeOrmModule.forRoot(databaseOptions()), AuthModule, AcessoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
