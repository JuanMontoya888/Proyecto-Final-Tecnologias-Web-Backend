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

// Endpoint para obtener todas las reservaciones
router.get('/reservacion', async (req, res) => {
  try {
    const snapshot = await db.collection('reservas').get();
    const reservas = [];
    snapshot.forEach(doc => {
      reservas.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(reservas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las reservaciones: ' + error.message });
  }
});

// Endpoint para actualizar una reservación por ID
router.put('/reservacion/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const nuevosDatos = req.body;

    const docRef = db.collection('reservas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Reservación no encontrada' });
    }

    await docRef.update(nuevosDatos);
    res.status(200).json({ message: 'Reservación actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar: ' + error.message });
  }
});

// Endpoint para eliminar una reservación por ID
router.delete('/reservacion/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const docRef = db.collection('reservas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Reservación no encontrada' });
    }

    await docRef.delete();
    res.status(200).json({ message: 'Reservación eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar: ' + error.message });
  }
});



module.exports = router;