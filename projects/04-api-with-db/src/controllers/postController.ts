import { Request, Response, NextFunction } from 'express';
import { findAll, findById, create as dbCreate, update as dbUpdate, remove as dbRemove } from '../models/Post';
import { createPostSchema, updatePostSchema } from '../schemas/postSchema';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';


export const index = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await findAll();
  return res.status(200).json(data);
  } catch (error) {
    next(error)
  }
}

export const show = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const post = await findById(id);

  if (!post) {
    return next(new AppError(404, 'Post not found'));
  }

  return res.status(200).json(post);
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = createPostSchema.safeParse(req.body);

  if (result.success) {
    const newPost = await dbCreate({ ...result.data });
    return res.status(201).json(newPost);
  } else {
    return res.status(422).json({ errors: result.error.errors });
  }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, 'Internal server error'));
  }
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const result = updatePostSchema.safeParse(req.body);
  
    if (!result.success) {
      return next(new AppError(422, 'Validation error'));
    }

    const post = await dbUpdate(id, { ...result.data });

    return res.status(200).json(post);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return next(new AppError(404, 'Post not found'));
    } 

    next(error);
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);

  await dbRemove(id);

  return res.status(204).send();
  } catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return next(new AppError(404, 'Post not found'));
  }
  next(error);
}
}

export const uploadCover = async (req: Request, res: Response, next: NextFunction) => {
  try {
     const id = parseInt(req.params.id);
      const post = await findById(id);

  if (!post) {
    return next(new AppError(404, 'Post not found'));
  }

  if (!req.file) {
    return next(new AppError(400, 'No file uploaded'));
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const updated = await dbUpdate(id, { imageUrl })

  return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError  && error.code === 'P2025') {
      return next(new AppError(404, 'Post not found'));
    } 

    next(error);
 }
}