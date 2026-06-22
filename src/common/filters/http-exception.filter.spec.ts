import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const createHost = (request: Partial<Request>, response: Partial<Response>): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    }) as ArgumentsHost;

  let status: jest.Mock;
  let json: jest.Mock;
  let response: Partial<Response>;

  beforeEach(() => {
    status = jest.fn().mockReturnThis();
    json = jest.fn();
    response = { status, json };
    jest.useFakeTimers().setSystemTime(new Date('2026-06-22T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats HttpException responses with request context', () => {
    const filter = new HttpExceptionFilter();
    const host = createHost({ url: '/api/test', method: 'POST' }, response);

    filter.catch(new HttpException('Payment required', HttpStatus.PAYMENT_REQUIRED), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.PAYMENT_REQUIRED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message: 'Payment required',
        error: 'HttpException',
        timestamp: '2026-06-22T00:00:00.000Z',
        path: '/api/test',
        method: 'POST',
      }),
    );
  });

  it('preserves validation error arrays', () => {
    const filter = new HttpExceptionFilter();
    const host = createHost({ url: '/api/users', method: 'POST' }, response);
    const exception = new BadRequestException({
      message: ['email must be an email', 'password should not be empty'],
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        errors: ['email must be an email', 'password should not be empty'],
        path: '/api/users',
        method: 'POST',
      }),
    );
  });

  it('formats unknown errors as internal server errors', () => {
    const filter = new HttpExceptionFilter();
    const host = createHost({ url: '/api/failure', method: 'GET' }, response);

    filter.catch(new Error('database unavailable'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'database unavailable',
        error: 'InternalServerError',
        path: '/api/failure',
        method: 'GET',
      }),
    );
  });
});
