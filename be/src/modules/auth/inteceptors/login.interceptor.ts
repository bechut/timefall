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
    const { body } = request;
    const pass = decrypt_AES(body.password);
    const newOtp = generate_string(6, true);
    const expired = 60;
    const otpId = v4();
    const otpJwt = this.jwtService.sign(
      {
        otpContext: otpContext.login,
        id: otpId,
        email: body.email,
      },
      { expiresIn: 60 * expired },
    );

    body.password = pass;
    body.otpContext = otpContext.login;
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
