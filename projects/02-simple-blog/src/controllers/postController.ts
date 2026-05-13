import { PostModel } from "../models/Post"
import { Request, Response } from 'express';

export const index = (req: Request, res: Response) => {
  const posts = PostModel.findAll();
  res.render('posts/index', { posts });
}

export const newForm = (req: Request, res: Response) => {
  res.render('posts/new');
}

export const create = (req: Request, res: Response) => {
  const { title, body } = req.body;
  PostModel.create({title, body});
  res.redirect('/posts');
}

export const show = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const post = PostModel.findById(id);

  if (!post) {
    res.status(404).send('Post not found');
  } else {
    res.render('posts/show', { post });
  }
}

export const editForm = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const post = PostModel.findById(id);

  if (!post) {
    res.status(404).send('Post not found');
  } else {
    res.render('posts/edit', { post });
  }
}

export const update = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const post = PostModel.findById(id);

  if (!post) {
    res.status(404).send('Post not found');
  } else {
    const { title, body } = req.body;
    PostModel.update(id, { title, body });
    res.redirect(`/posts/${id}`);
  }
}

export const remove = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  PostModel.delete(id);
  res.redirect('/posts');
}