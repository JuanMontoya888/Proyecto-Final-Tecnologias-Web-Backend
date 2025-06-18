const express = require('express');
const router = express.Router();
const cors = require('cors');
const admin = require('../firebase');

//Inicializar y obtener referencia al servicio de authentication de firebase
const db = admin.firestore();


//llamamos a la base de datos para las reservas, en la coleccion reservas
// Endpoint para guardar reservaciones
router.post('/reservacion', async (req, res) => {
  try {
    const reservacion = req.body;
    const docRef = await db.collection('reservas').add({
      ...reservacion,
      createdAt: new Date()
    });
    res.status(200).json({ message: 'Reservación guardada en Firestore', id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar: ' + error.message });
  }
});

router.get('/getReservas', async (req, res) => {

  const data = (await db.collection('reservas').get()).docs.map((doc) => doc.data());

  console.log(data);

  res.json({ok: true, data: data});
});

module.exports = router;