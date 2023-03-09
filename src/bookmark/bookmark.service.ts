import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.bookmark.findMany();
  }

  get(userId: number) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  getById(id: number) {
    return this.prisma.bookmark.findUnique({
      where: {
        id,
      },
    });
  }

  create(dto: CreateBookmarkDto, userId: number) {
    return this.prisma.bookmark.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async edit(dto: EditBookmarkDto, id: number, userId: number) {
    const isExistedAndValid = await this.prisma.bookmark.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!isExistedAndValid) throw new BadRequestException('Invalid bookmark');

    return await this.prisma.bookmark.update({
      where: {
        id,
      },
      data: {
        ...dto,
      },
    });
  }

  async delete(id: number, userId: number) {
    const isExistedAndValid = await this.prisma.bookmark.findFirst({
      where: {
        id,
        userId,
      },
    });
    if (!isExistedAndValid) throw new BadRequestException('Invalid bookmark');

    await this.prisma.bookmark.delete({
      where: {
        id,
      },
    });

    return;
  }
}
