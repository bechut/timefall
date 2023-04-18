import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { otpContext } from 'src/constants/auth';
import { generate_string } from 'src/helpers/generate_string';
import * as moment from 'moment';
import { decrypt_AES } from 'src/helpers/aes';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';

@Injectable()
export class LogInInterceptor implements NestInterceptor {
  constructor(
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { body, headers } = request;

    // login with bearer is used to link with google account
    const bearer = headers?.authorization?.split(' ')[1];
    const decode: any = this.jwtService.decode(bearer);

    let pass = '';
    let newOtp = '';
    let expired = 0;
    let otpId = '';
    let otpJwt = '';
    let ctx = otpContext.login;

    if (!bearer) {
      pass = decrypt_AES(body.password);
      newOtp = generate_string(6, true);
      expired = 60;
      otpId = v4();
      otpJwt = this.jwtService.sign(
        {
          otpContext: otpContext.login,
          id: otpId,
          email: body.email,
        },
        { expiresIn: 60 * expired },
      );
    } else {
      ctx = decode.otpContext;
      newOtp = decode.otp;
      expired = 10;
      otpId = decode.otpId;
      otpJwt = bearer;
    }

    body.password = pass;
    body.otpContext = ctx;
    body.newOtp = newOtp;
    body.otpExpiredDate = moment().add(expired, 'minutes').toDate();
    body.otpExpired = expired;
    body.otpId = otpId;
    body.otpJwt = otpJwt;

    console.log('Before login...');

    return next.handle().pipe(
      tap(() => {
        console.log(`After login...`);
        this.mailerService
          .sendMail({
            from: this.configService.get<string>('ADMIN_EMAIL'),
            to: [
              this.configService.get<string>('RECEIVER_TEST_EMAIL') ||
                body.email,
            ],
            subject: 'Log In',
            context: {
              id: body.otpId,
              otp: body.newOtp,
              email: body.email,
            },
            template: 'signup',
          })
          .then((x: any) => console.log(x))
          .catch((e: any) => console.log(e));
      }),
    );
  }
}
