//Crear el enlace a la base de datos
var admin = require("firebase-admin");
var serviceAccount = require("./firestore-key.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });


module.exports = admin;