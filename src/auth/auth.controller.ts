import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  //   authService: AuthService;
  //   constructor(authService: AuthService) {
  //     this.authService = authService;
  //   }
  // instead of doing this, we
  // nest will auto inject the service for us
  constructor(private authService: AuthService) {}

  /* nest will auto handle the return datatype for us eg. application/json */

  @Post('signup')
  signup(
    @Body() dto: AuthDto,
    // @Body('email') email: string,
    // @Body('password') password: string,
  ) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.login(dto);
  }
}
