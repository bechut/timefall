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
import { otpContext } from 'src/constants/auth';
import { generate_string } from 'src/helpers/generate_string';
import * as moment from 'moment';
import { decrypt_AES } from 'src/helpers/aes';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import * as _ from 'lodash';
import { LinkGoogleType } from 'src/orm/entity/user.entity';

@Injectable()
export class LogInWithGoogleInterceptor implements NestInterceptor {
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
    const bearer = request?.headers?.authorization?.split(' ')[1];
    if (!bearer) {
      throw new HttpException(
        { message: 'Auth token missing' },
        HttpStatus.NOT_FOUND,
      );
    }

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    const ticket = await client.verifyIdToken({
      audience: process.env.GOOGLE_CLIENT_ID,
      idToken: bearer,
    });

    request.body = _.pick(ticket.getPayload(), [
      'email',
      'email_verified',
      'picture',
      'given_name',
      'family_name',
    ]);

    const expired = 10;
    const otpId = v4();
    const otp = generate_string(6, true);
    const otpJwt = this.jwtService.sign(
      {
        id: otpId,
        otpContext: otpContext.sign_up_google,
        email: request.body.email,
      },
      { expiresIn: 60 * expired },
    );

    request.body.expiredDate = moment().add(expired, 'minutes').toDate();
    request.body.otpId = otpId;
    request.body.otpJwt = otpJwt;
    request.body.otp = otp;

    console.log('Before LogInWithGoogleInterceptor...');

    return next.handle().pipe(
      tap(() => {
        console.log(`After LogInWithGoogleInterceptor...`);

        if (
          ![LinkGoogleType.NO_LINK, LinkGoogleType.LINKED].includes(
            request.body.type,
          )
        ) {
          this.mailerService
            .sendMail({
              from: this.configService.get<string>('ADMIN_EMAIL'),
              to: [
                this.configService.get<string>('RECEIVER_TEST_EMAIL') ||
                  request.body.email,
              ],
              subject: 'Link your account with google account',
              context: {
                id: request.body.otpId,
                otp: request.body.otp,
                email: request.body.email,
              },
              template: 'signup',
            })
            .then((x: any) => console.log(x))
            .catch((e: any) => console.log(e));
        }
      }),
    );
  }
}
