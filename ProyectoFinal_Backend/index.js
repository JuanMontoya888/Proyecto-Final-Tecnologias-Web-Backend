const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const misRutas = require('./routes/routes');
const ABC_Users = require('./routes/ABC-Users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/', misRutas);
app.use('/', ABC_Users);

// Levanta el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
