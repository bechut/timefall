import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';
import { generate_string } from 'src/helpers/generate_string';
import * as moment from 'moment';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EXPIRED_IN_MINUTES } from 'src/constants/auth';

@Injectable()
export class ResendInterceptor implements NestInterceptor {
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
    const bearer = request.headers.authorization?.split(' ')[1];
    if (bearer) {
      const decode: any = this.jwtService.decode(bearer);

      if (!decode) {
        throw new HttpException(
          { message: 'Missing auth token' },
          HttpStatus.BAD_REQUEST,
        );
      }

      request.body.decode = decode;
      const newOtp = generate_string(6, true);
      const expired = EXPIRED_IN_MINUTES.verify;
      const jwt: string = this.jwtService.sign(
        {
          id: decode.id,
          otp: newOtp,
          otpContext: decode.otpContext,
          email: decode.email,
        },
        { expiresIn: 60 * expired },
      );
      request.body.otpJwt = jwt;
      request.body.newOtp = newOtp;
      request.body.expired = moment().add(expired, 'minutes').toDate();
    } else {
      throw new HttpException(
        { message: 'Missing auth token' },
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log('Before resend...');

    return next.handle().pipe(
      tap(() => {
        console.log(`After resend...`);
        this.mailerService
          .sendMail({
            from: this.configService.get<string>('ADMIN_EMAIL'),
            to: [
              this.configService.get<string>('RECEIVER_TEST_EMAIL') ||
                request.body.decode.email,
            ],
            subject: 'Resend OTP',
            context: {
              otp: request.body.newOtp,
              email: request.body.decode.email,
            },
            template: 'resend_otp',
          })
          .then((x: any) => console.log(x))
          .catch((e: any) => console.log(e));
      }),
    );
  }
}
