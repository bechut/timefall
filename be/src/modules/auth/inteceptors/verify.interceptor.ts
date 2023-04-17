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
import { otpContext } from 'src/constants/auth';

@Injectable()
export class VerifyInterceptor implements NestInterceptor {
  constructor(private jwtService: JwtService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    if (request.headers.authorization) {
      const bearer = request.headers.authorization.split(' ')[1];

      try {
        await this.jwtService.verify(bearer);
        const decode = this.jwtService.decode(bearer);
        request.body.decode = decode;
      } catch (e) {
        throw new HttpException(e, HttpStatus.BAD_REQUEST);
      }
    } else {
      throw new HttpException(
        { message: 'Missing auth token' },
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log('Before verify...');

    return next.handle().pipe(
      tap(() => {
        console.log(`After verify...`);
      }),
    );
  }
}
