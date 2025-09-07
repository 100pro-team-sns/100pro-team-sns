const express = require('express');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api', apiRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = { app, server };