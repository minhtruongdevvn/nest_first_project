import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

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
  signup() {
    return 'sign up';
  }

  @Post('signin')
  signin() {
    return 'sign in';
  }
}
