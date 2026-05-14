import express from 'express';
import postRouter from './routes/posts';
import { errorHandler } from './middleware/errorHandler';
import path from 'path';

const app = express();
const port = 3001;

app.use(express.json());
app.use('/api/posts/', postRouter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/', (req, res) => res.json({ message: 'API работает' }));
app.use(errorHandler);

app.listen(port, () => console.log('server started on port', port));