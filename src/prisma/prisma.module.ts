import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common/decorators';
import { PrismaService } from './prisma.service';

@Global() // so we dont need to import to each module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
