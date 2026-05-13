import express from 'express';
import path from 'path';
import postRouter from './routes/posts';

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/posts/', postRouter)

app.get('/', (req, res) => {
  res.redirect('/posts');
})

app.listen(port, () => {
  console.log('server started on port', port);
})


