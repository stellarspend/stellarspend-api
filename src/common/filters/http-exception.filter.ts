import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  method: string;
  errors?: string[];
  stack?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let base: ErrorResponse = {
      success: false,
      statusCode: status,
      message: 'Internal server error',
      error: 'InternalServerError',
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      let message: string | string[] = 'Error';
      let error = exception.name;

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        if (typeof r.message === 'string' || Array.isArray(r.message)) {
          message = r.message as string | string[];
        }
        if (typeof r.error === 'string') {
          error = r.error;
        }
      }

      base = {
        ...base,
        statusCode: status,
        message: Array.isArray(message) ? 'Validation failed' : String(message),
        error,
        errors: Array.isArray(message) ? message : undefined,
      };
    } else if (exception instanceof Error) {
      base = {
        ...base,
        message: exception.message || base.message,
      };
    }

    if (process.env.NODE_ENV !== 'production' && exception instanceof Error && exception.stack) {
      base = { ...base, stack: exception.stack };
    }

    response.status(status).json(base);
  }
}

