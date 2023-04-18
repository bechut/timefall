import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EXPIRED_IN_MINUTES, otpContext } from 'src/constants/auth';
import { generate_string } from 'src/helpers/generate_string';
import * as moment from 'moment';
import { decrypt_AES } from 'src/helpers/aes';
import { JwtService } from '@nestjs/jwt';
import { hash, genSalt } from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';

@Injectable()
export class SignUpInterceptor implements NestInterceptor {
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
    const newOtp = generate_string(6, true);
    const expired = EXPIRED_IN_MINUTES.verify;
    const otpId = v4();
    const otpJwt = this.jwtService.sign(
      {
        otpContext: otpContext.sign_up,
        id: otpId,
        email: body.email,
      },
      { expiresIn: 60 * expired },
    );

    body.otpContext = otpContext.sign_up;
    body.newOtp = newOtp;
    body.otpExpiredDate = moment().add(expired, 'minutes').toDate();
    body.otpExpired = expired;
    const pass = decrypt_AES(body.password);
    body.password = await hash(pass, await genSalt(11));
    body.otpId = otpId;
    body.otpJwt = otpJwt;

    console.log('Before sign up...');

    return next.handle().pipe(
      tap(() => {
        console.log(`After sign up...`);
        this.mailerService
          .sendMail({
            from: this.configService.get<string>('ADMIN_EMAIL'),
            to: [
              this.configService.get<string>('RECEIVER_TEST_EMAIL') ||
                body.email,
            ],
            subject: 'Register new account',
            context: {
              otp: body.newOtp,
              email: body.email,
            },
            template: 'resend_otp',
          })
          .then((x: any) => console.log(x))
          .catch((e: any) => console.log(e));
      }),
    );
  }
}
