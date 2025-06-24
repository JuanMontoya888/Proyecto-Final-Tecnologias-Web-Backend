const express = require('express');
const router = express.Router();
const cors = require('cors');
const admin = require('../firebase');
const db = admin.firestore();

router.post('/addComentario', async (req, res) => {
    const { data } = req.body;

    try {
        await db.collection('comentarios').add(data)
            .then((result) => {
                return res.status(200).json({ ok: true, message: 'Was added successfully' });
            })
            .catch((error) => {
                return res.status(500).json({ ok: false, message: err.message });
            })
    } catch (err) {
        return res.status(500).json({ ok: false, message: err.message });
    }
});

router.get('/getComentarios', async (req, res) => {
    try {
        const data = (await db.collection('comentarios').get()).docs.map((doc) => { return { ...doc.data(), id: doc.id } });

        if (!data) {
            return res.json({ ok: false, data: null });
        }

        return res.json({ ok: true, data: data });
    } catch (err) {
        return res.status(500).json({ ok: false, message: err.message });
    }
});

router.delete('/deleteComentariosByID/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.collection('comentarios').doc(id).delete();

        return res.json({ ok: true, message: 'was deleted' });

    } catch (err) {
        return res.status(500).json({ ok: false, message: err.message });
    }
});

router.post('/modifyComentariosByID', async (req, res) => {
    const { data } = req.body;
    const { id } = req.body;

    try {
        await db.collection('comentarios').doc(id).update(data);

        return res.json({ ok: true });
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
});

module.exports = router;