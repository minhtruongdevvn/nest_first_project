import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt/dist';
import { Prisma } from '@prisma/client';
import * as argon from 'argon2';
import constant from 'src/constant';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new UnauthorizedException('Credentials incorrect');

    if (!(await argon.verify(user.hash, dto.password)))
      throw new UnauthorizedException('Credentials incorrect');

    return await this.signToken(user.id, user.email);
  }

  async signup(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

      return await this.signToken(user.id, user.email);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code == constant.error.dbDupplicateErrorCode)
          throw new BadRequestException('Credentials taken');
      }
      throw err;
    }
  }

  async signToken(userId: number, email: string) {
    const payload = {
      sub: userId,
      email: email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SIGN_SECRET'),
    });

    return {
      access_token: token,
    };
  }
}
