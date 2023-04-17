import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const ctx = context.switchToHttp();
    // const resquest = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        const message = data?.message || 'Success';
        const pager = data?.pager || {};
        delete data?.message;
        delete data?.pager;
        return {
          pager,
          message,
          status: 1,
          data,
        };
      }),
    );
  }
}
