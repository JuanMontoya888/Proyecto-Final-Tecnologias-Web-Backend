const express = require('express');
const morgan = require('morgan');
const misRutas = require('./routes/routes');
const ABC_Users = require('./routes/ABC-Users')


//instancia de express
const app = express();
const PORT = process.env.PORT || 3000;

//Codigo para poder ejecutar la api correctamente
const cors = require('cors');

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));

app.listen(PORT, () => {
    console.log(`Servidor ejecutandose en el puerto :${PORT}`);
});

app.use('/', misRutas);
app.use('/', ABC_Users);
