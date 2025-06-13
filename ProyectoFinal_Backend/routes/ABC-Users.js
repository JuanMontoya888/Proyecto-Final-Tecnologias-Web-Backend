const express = require('express');
const router = express.Router();
const cors = require('cors');
const admin = require('../firebase');
const bcrypt = require('bcrypt');
const adm_FB = require("firebase-admin");

const saltRounds = 10;

//Inicializar y obtener referencia al servicio de authentication de firebase
const db = admin.firestore();

router.post('/login_email', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Hacemos consulta en vez de traer todos los datos
        const querySnapshot = await db.collection('users').where('data.email', '==', email).get();

        if (querySnapshot.empty) {
            return res.json({ ok: false, message: 'not-found' });
        }

        const doc = querySnapshot.docs[0];
        const userData = doc.data().data;

        const isMatch = await bcrypt.compare(password, userData.password);

        console.log(userData);

        if (isMatch && userData.isAvailable) {
            //console.log({ ok: true, user: userData });
            return res.json({ ok: true, user: userData });
        } else {

            const dataSend = (userData.attempts + 1) <= 3 ? { 'data.attempts': admin.firestore.FieldValue.increment(1) } : { 'data.attempts': admin.firestore.FieldValue.increment(1), 'data.isAvailable': false };
            console.log(dataSend);

            await db.collection('users').doc(doc.id).update(dataSend);

            if ((userData.attempts + 1) <= 3) {
                console.log({ ok: false, message: 'incorrect-password' });
                return res.json({ ok: false, message: 'incorrect-password' });
            } else {
                //Aqui implementare el deshabilitar la cuenta
                console.log({ ok: false, message: 'account-blocked' }, userData.UID);


                if (userData.isAvailable) {
                    // con el admin de FB direcatamente en autenticacion lo deshabilitamos
                    adm_FB.auth().updateUser(userData.UID, { disabled: true }).then((user) => {
                        console.log('Cuenta deshabilitada:', user);
                    });
                }
                return res.json({ ok: false, message: 'account-blocked' });
            }
        }

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ ok: false, message: 'server-error' });
    }
});


router.post('/getUser', async (req, res) => {
    const { uid } = req.body;

    try {
        const querySnapshot = await db.collection('users').where('data.UID', '==', uid).get();

        if (querySnapshot.empty) {
            return res.json({ user: null });
        }

        const doc = querySnapshot.docs[0];
        const userFound = doc.data().data;

        return res.json({ user: userFound });

    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/addUserGoogle', async (req, res) => {
    try {
        let data = req.body;

        console.log(data);
        
        db.collection('users').add(data)
            .then((result) => {
                res.status(200).json({ ok: true, message: 'Was created successfully' });
            })
            .catch((err) => {
                res.status(500).json({ ok: false, message: err.message });
            });
    } catch (err) {
        console.error('Error al crear el usuario:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});


router.post('/createUser', (req, res) => {
    //const { UID, authMethod, name, username } = req.body;
    let data = req.body;

    bcrypt.hash(data.data.password, saltRounds, (err, hash) => {
        if (err) console.log(err);
        data.data.password = hash;
        console.log(data);
        db.collection('users').add(data)
            .then((result) => {
                res.status(200).json({ ok: true, message: 'Was created successfully' });
            })
            .catch((err) => {
                res.status(500).json({ ok: false, message: err.message });
            });
    });

});

module.exports = router;