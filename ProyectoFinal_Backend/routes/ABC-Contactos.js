const express = require('express');
const router = express.Router();
const cors = require('cors');
const admin = require('../firebase');
const db = admin.firestore();

router.post('/addContacto', async (req, res) => {
    const { data } = req.body;

    try {
        await db.collection('contactos').add(data)
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

router.get('/getContactos', async (req, res) => {
    try {
        const data = (await db.collection('contactos').get()).docs.map((doc) => doc.data());

        if (!data) {
            return res.json({ ok: false, data: null });
        }

        return res.json({ ok: true, data: data });
    } catch (err) {
        return res.status(500).json({ ok: false, message: err.message });
    }
});


module.exports = router;