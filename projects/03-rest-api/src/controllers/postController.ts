import { Request, Response, NextFunction } from 'express';
import { PostModel } from '../models/Post';
import { createPostSchema, updatePostSchema } from '../schemas/postSchema';
import { AppError } from '../middleware/errorHandler';

export const index = (req: Request, res: Response) => {
  const data = PostModel.findAll();
  return res.status(200).json(data);
}

export const show = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  const post = PostModel.findById(id);

  if (!post) {
    return next(new AppError(404, 'Post not found'));
  }

  return res.status(200).json(post);
}

export const create = (req: Request, res: Response, next: NextFunction) => {
  const result = createPostSchema.safeParse(req.body);

  if (result.success) {
    const newPost = PostModel.create({ ...result.data, imageUrl: null });
    return res.status(201).json(newPost);
  } else {
    return res.status(422).json({ errors: result.error.errors });
  }
}

export const update = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  const result = updatePostSchema.safeParse(req.body);
  
  if (!result.success) {
    return next(new AppError(422, 'Validation error'));
  }

  const post = PostModel.update(id, {...result.data});

  if (!post) {
    return next(new AppError(404, 'Post not found'));
  }

  return res.status(200).json(post);
}

export const remove = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);

  const success = PostModel.delete(id);

  if (!success) {
    return next(new AppError(404, 'Post not found'));
  }

  return res.status(204).send();
}

export const uploadCover = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  const post = PostModel.findById(id);

  if (!post) {
    return next(new AppError(404, 'Post not found'));
  }

  if (!req.file) {
    return next(new AppError(400, 'No file uploaded'));
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const updated = PostModel.updateImage(id, imageUrl)

  return res.status(200).json(updated);
}