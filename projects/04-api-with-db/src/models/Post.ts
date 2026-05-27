import prisma from "../lib/prisma";

export const findAll = () => prisma.post.findMany({ orderBy: { createdAt: "desc" } });

export const findById = (id: number) => prisma.post.findUnique({ where: { id } });

export const create = (data: { title: string; body: string; imageUrl?: string }) =>
  prisma.post.create({ data });

export const update = (id: number, data: { title?: string; body?: string; imageUrl?: string }) =>
  prisma.post.update({ where: { id }, data });

export const remove = (id: number) => prisma.post.delete({ where: { id } });
