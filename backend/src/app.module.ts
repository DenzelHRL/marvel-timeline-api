import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database/data-source';

@Module({
  imports: [TypeOrmModule.forRoot(databaseOptions())],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
