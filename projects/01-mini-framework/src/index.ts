import { createApp } from "./app.js";

const app = createApp();

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
})

app.get('/users', (req, res) => {
  res.status(200).json([{id: 1, name: 'Vasya'}, {id: 2, name: 'Petya'}]);
})

app.get('/users/:id', (req, res) => {
  res.json({id: req.params.id});
})

app.post('/users', (req, res) => {
  console.log('body:', req.body);
  res.status(201).json({created: true});
})

app.listen(3000);