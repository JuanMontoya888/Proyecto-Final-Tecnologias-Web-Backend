const admin = require("firebase-admin");
const fs = require("fs");

let serviceAccount;

try {
  // Intenta cargar el archivo local
  if (fs.existsSync("./firestore-key.json")) {
    serviceAccount = require("./firestore-key.json");
    console.log("🔑 Usando archivo local de credenciales");
  } else {
    throw new Error("Archivo firestore-key.json no encontrado");
  }
} catch (err) {
  // Si no se encuentra o hay error, usa variable de entorno
  if (!process.env.FIREBASE_CONFIG) {
    console.error("No se encontró ni el archivo ni la variable de entorno FIREBASE_CONFIG");
    process.exit(1);
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  console.log("Usando FIREBASE_CONFIG desde variable de entorno");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
