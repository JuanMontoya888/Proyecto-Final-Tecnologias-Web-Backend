const express = require('express');
const router = express.Router();
const cors = require('cors');
const admin = require('../firebase');
const bcrypt = require('bcrypt');
const adm_FB = require("firebase-admin");

//Inicializar y obtener referencia al servicio de authentication de firebase
const db = admin.firestore();

const saltRounds = 10;

// Enviar correos
const { enviarCorreoSMTP } = require('../mailer.js');

router.post('/login_email', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Hacemos consulta en vez de traer todos los datos
        const querySnapshot = await db.collection('users').where('data.email', '==', email).get();

        if (querySnapshot.empty) {
            return res.json({ ok: false, message: 'not-registered' });
        }

        const doc = querySnapshot.docs[0];
        const userData = doc.data().data;

        const isMatch = await bcrypt.compare(password, userData.password);

        console.log(userData);

        if (isMatch && userData.isAvailable) {
            //console.log({ ok: true, user: userData });
            return res.json({ ok: true, user: userData });
        } else {

            const dataSend = (userData.attempts + 1) <= 3 ?
                { 'data.attempts': admin.firestore.FieldValue.increment(1) } :
                { 'data.attempts': admin.firestore.FieldValue.increment(1), 'data.isAvailable': false };
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

router.post('/login_phoneNumber', async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        // Hacemos consulta en vez de traer todos los datos
        const querySnapshot = await db.collection('users').where('data.phoneNumber', '==', phoneNumber).get();

        if (querySnapshot.empty) {
            return res.json({ ok: false, message: 'not-registered' });
        }

        const doc = querySnapshot.docs[0];
        const userData = doc.data().data;

        console.log(userData);
        return res.json({ ok: true, user: userData });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ ok: false, message: 'server-error' });
    }
});


router.post('/getUser', async (req, res) => {
    const { uid, email } = req.body;
    
    try {
        const querySnapshot = uid ? 
         await db.collection('users').where('data.UID', '==', uid).get():
         await db.collection('users').where('data.email', '==', email).get();

        if (querySnapshot.empty) {
            return res.json({ ok: false, user: null });
        }

        const doc = querySnapshot.docs[0];
        const userFound = doc.data().data;

        return res.json({ ok: true, user: userFound });

    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
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
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
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

router.post('/sendMail', (req, res) => {
    const { email, reservacion, user } = req.body;

    console.log(reservacion);

    const msg = {
        to: email,
        subject: 'Hotel System',
        html: `
                <h2>Confirmación de Reservación</h2>
                <p>¡Hola <strong>${reservacion.nombre} !</strong>,</p>
                <p>Gracias por elegir el <strong>${reservacion.hotel}</strong>.</p>

                <h3>Detalles de su reservación:</h3>
                <ul>
                    <li><strong>Fecha de entrada:</strong> ${new Date(reservacion.fechaInicio).toLocaleDateString()}</li>
                    <li><strong>Fecha de salida:</strong> ${new Date(reservacion.fechaFin).toLocaleDateString()}</li>
                    <li><strong>Tipo de habitación:</strong> ${reservacion.tipoHabitacion}</li>
                    <li><strong>Método de pago:</strong> ${reservacion.metodoPago}</li>
                </ul>

                <h3>Servicios seleccionados:</h3>
                <ul>
                    ${reservacion.serviciosSeleccionados.map(serv => `<li>${serv}</li>`).join('')}
                </ul>

                <h3>Resumen de costos:</h3>
                <ul>
                    <li><strong>Precio base:</strong> $${reservacion.precioBase}</li>
                    <li><strong>Precio por servicios:</strong> $${reservacion.precioServicios}</li>
                    <li><strong>Total:</strong> $${reservacion.precioTotal}</li>
                </ul>

                <p>Esperamos que disfrute su estancia.</p>
                <p>Atentamente, Juan de <br><strong>${reservacion.hotel}</strong></p>
            `,

    };

    enviarCorreoSMTP(msg)
        .then((resp) => {
            res.json(resp);
        })
        .catch((err) => {
            res.status(500).json(err);
        })
});

router.post('/getCode', (req, res) => {
    const { email } = req.body;
    const code = Math.floor(Math.random() * (999999 - 111111) + 111111);

    const msg = {
        to: email,
        subject: 'Hotel System',
        html: `Your code is '${code}'`,
    };

    enviarCorreoSMTP(msg)
        .then((resp) => {
            const { ok } = resp;
            res.json({ ok, code });
        })
        .catch((err) => {
            res.status(500).json(err);
        });

});

router.post('/unlockAccount', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const querySnapshot = await db.collection('users').where('data.email', '==', email).get();

        if (querySnapshot.empty) {
            return res.json({ ok: false });
        }

        const doc = querySnapshot.docs[0];
        const userFound = doc.data().data;

        adm_FB.auth().updateUser(userFound.UID, { disabled: false, password: newPassword })
            .then(async (user) => {
                const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

                const dataSend =
                    { 'data.attempts': 0, 'data.isAvailable': true, 'data.password': newPasswordHash };
                console.log(dataSend);

                await db.collection('users').doc(doc.id).update(dataSend);
                
                return res.json({ ok: true });
            })
            .catch((err) => {
                return res.json({ ok: false });
            });
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }

});

module.exports = router;