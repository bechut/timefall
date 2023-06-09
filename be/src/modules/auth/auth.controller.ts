import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpInterceptor } from './inteceptors/signup.interceptor';
import { LogInDto, SignUpDto, VerifyDto } from './auth.dto';
import { VerifyInterceptor } from './inteceptors/verify.interceptor';
import { ResendInterceptor } from './inteceptors/resend.interceptor';
import { LogInInterceptor } from './inteceptors/login.interceptor';
import { LogInWithGoogleInterceptor } from './inteceptors/login-with-google.interceptor';
import { LinkGoogleType } from 'src/orm/entity/user.entity';

export type XSignUp = SignUpDto & {
  otpId: string;
  otpExpiredDate: Date;
  newOtp: string;
  otpContext: string;
  otpJwt: string;
};

export type XVerify = VerifyDto & {
  decode: any;
  response: any;
};

export type XResend = {
  decode: any;
  otpJwt: string;
  newOtp: string;
  expired: Date;
};

export type XLogIn = LogInDto & {
  otpId: string;
  otpExpiredDate: Date;
  newOtp: string;
  otpContext: string;
  otpJwt: string;
};

export type XLogInWidthGoogle = {
  email: string;
  email_verified: boolean;
  picture: string;
  given_name: string;
  family_name: string;
  expiredDate: Date;
  otpId: string;
  otpJwt: string;
  otp: string;
  type: LinkGoogleType;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign_up')
  @UseInterceptors(SignUpInterceptor)
  async sign_up(@Body() body: XSignUp) {
    return this.authService.sign_up(body);
  }

  @Post('verify')
  @UseInterceptors(VerifyInterceptor)
  async verify(@Body() body: XVerify) {
    return this.authService.verify(body);
  }

  @Post('resend')
  @UseInterceptors(ResendInterceptor)
  async resend(@Body() body: XResend) {
    return this.authService.resend(body);
  }

  @Post('login')
  @UseInterceptors(LogInInterceptor)
  async login(@Body() body: XLogIn) {
    return this.authService.login(body);
  }

  @Post('login-with-google')
  @UseInterceptors(LogInWithGoogleInterceptor)
  async loginWithGoogle(@Body() body: XLogInWidthGoogle) {
    return this.authService.loginWithGoogle(body);
  }
}
