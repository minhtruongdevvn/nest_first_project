import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { EditBookmarkDto } from './dto/edit-bookmark.dto';

@Controller('bookmarks')
export class BookmarkController {
  constructor(private service: BookmarkService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getAll() {
    return this.service.getAll();
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  get(@GetUser('id') userId: number) {
    return this.service.get(userId);
  }

  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBookmarkDto, @GetUser('id') userId: number) {
    return this.service.create(dto, userId);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  edit(
    @Body() dto: EditBookmarkDto,
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ) {
    return this.service.edit(dto, id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  delete(@Param('id', ParseIntPipe) id: number, @GetUser('id') userId: number) {
    return this.service.delete(id, userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id);
  }
}
