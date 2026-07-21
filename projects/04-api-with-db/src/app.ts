import express from 'express';
import postsRouter from './routes/posts';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use('/api/posts', postsRouter);
app.use('/uploads', express.static('uploads'));
app.use(errorHandler);

app.listen(port, () => console.log('server started on port', port));

export default app;