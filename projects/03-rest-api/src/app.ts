import express from 'express';

const app = express();
const port = 3001;

app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'API работает' }));

app.listen(port, () => console.log('server started on port', port));