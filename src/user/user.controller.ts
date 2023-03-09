import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getMe(/* @Req() req: Request */ @GetUser() user: User) {
    // req.user
    return user;
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  editMe(@Body() dto: { email: string }, @GetUser() user: User) {
    return this.userService.editUser(user.id, dto);
  }
}
