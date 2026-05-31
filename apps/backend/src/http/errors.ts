import type { Response } from 'express'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | (string & {})

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode
    message: string
  }
}

export function sendError (
  res: Response,
  statusCode: number,
  code: ApiErrorCode,
  message: string
): void {
  const body: ApiErrorResponse = {
    error: {
      code,
      message
    }
  }

  res.status(statusCode).json(body)
}
