export interface Post {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;  // null если обложки нет
  createdAt: Date;
}

let posts: Post[] = [];
let nextId = 1;

export const PostModel = {
  findAll(): Post[] {
    return posts;
  },

  create(data: Pick<Post, 'title' | 'body' | 'imageUrl'>): Post {
    const post = { ...data, id: nextId++, createdAt: new Date() };
    posts.push(post);
    return post;
  },

  findById(id: number): Post | undefined {
    const posts = this.findAll();
    return posts.find(post => {
      return post.id === id;
    })
  },


  update(id: number, data: Partial<Pick<Post, 'title' | 'body'>>): Post | undefined {
    const posts = this.findAll();
    const index = posts.findIndex(post => {
      return post.id === id;
    })

    if (index === -1) return undefined;

    posts[index] = { ...posts[index], ...data };
    return posts[index];
  },

  delete(id: number): boolean {
    const posts = this.findAll();
    const index = posts.findIndex(post => post.id === id);
    if (index === -1) return false;
    posts.splice(index, 1);
    return true;
  },

  updateImage(id: number, imageUrl: string): Post | undefined {
    const all = this.findAll();
    const index = all.findIndex(post => post.id === id);
    if (index === -1) return undefined;
    all[index] = { ...all[index], imageUrl };
    return all[index];
  }
}