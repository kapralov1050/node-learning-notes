import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен').max(100),
  body: z.string().min(1, 'Тело обязательно').max(5000),
  author: z.string().min(1).max(50).default('Anonymous'),
  imageUrl: z.string().optional(),
})

export const updatePostSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  body: z.string().min(1).max(5000).optional(),
  author: z.string().min(1).max(50).optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>