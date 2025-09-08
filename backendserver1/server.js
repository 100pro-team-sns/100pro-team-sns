const cors = require('cors');
const express = require('express');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173', //TODO: 本番環境の整備時にここのオリジンを本番環境のものに変更する
  credentials: true,
}))

app.use(express.json());

app.use('/api', apiRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = { app, server };