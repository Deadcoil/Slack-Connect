import type { Request, Response, NextFunction } from "express"

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}


export function errorHandler(error: AppError, req: Request, res: Response, next: NextFunction): void {
  console.error("Error:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  
  let statusCode = error.statusCode || 500
  let message = error.message || "Internal Server Error"

  
  if (error.name === "ValidationError") {
    statusCode = 400
    message = "Validation Error"
  } else if (error.name === "UnauthorizedError") {
    statusCode = 401
    message = "Unauthorized"
  } else if (error.name === "CastError") {
    statusCode = 400
    message = "Invalid ID format"
  }

  
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Something went wrong"
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  })
}


export function createError(message: string, statusCode = 500): AppError {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.isOperational = true
  return error
}


export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
