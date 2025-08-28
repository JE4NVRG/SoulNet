/**
 * Utility functions for standardized API responses
 * All API responses should follow the pattern: {ok, data} or {error, code}
 */

import { Response } from 'express';

/**
 * Standard success response format
 */
export interface ApiSuccessResponse<T = any> {
  ok: true;
  data: T;
}

/**
 * Standard error response format
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
}

/**
 * Send a standardized success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    ok: true,
    data
  } as ApiSuccessResponse<T>);
}

/**
 * Send a standardized error response
 */
export function sendError(
  res: Response,
  error: string,
  code: string,
  statusCode: number = 400
): void {
  res.status(statusCode).json({
    error,
    code
  } as ApiErrorResponse);
}

/**
 * Send a validation error (400)
 */
export function sendValidationError(
  res: Response,
  error: string
): void {
  sendError(res, error, 'VALIDATION_ERROR', 400);
}

/**
 * Send a not found error (404)
 */
export function sendNotFound(
  res: Response,
  error: string = 'Resource not found'
): void {
  sendError(res, error, 'NOT_FOUND', 404);
}

/**
 * Send an internal server error (500)
 */
export function sendInternalError(
  res: Response,
  error: string = 'Internal Server Error'
): void {
  sendError(res, error, 'INTERNAL', 500);
}

/**
 * Send an unauthorized error (401)
 */
export function sendUnauthorized(
  res: Response,
  error: string = 'Unauthorized'
): void {
  sendError(res, error, 'UNAUTHORIZED', 401);
}

/**
 * Send a forbidden error (403)
 */
export function sendForbidden(
  res: Response,
  error: string = 'Forbidden'
): void {
  sendError(res, error, 'FORBIDDEN', 403);
}