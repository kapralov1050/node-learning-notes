import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);

  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({error: err.message})
  }

  if (err.message === 'Только изображения') {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({error: err.message})
}