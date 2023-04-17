import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpExceptionInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err: any): any => {
        throw new HttpException(
          {
            message: err?.response?.message || err.message || 'Error',
            status: 0,
            data: null,
            pager: {},
          },
          err.status,
        );
      }),
    );
  }
}
