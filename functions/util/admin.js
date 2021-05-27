const admin = require('firebase-admin');

//var serviceAccount = require('../serviceAcc/socialapp-fscozzatti-8f5727610017.json');
/*{
    credential: admin.credential.cert(serviceAccount)
}*/
admin.initializeApp();


const db = admin.firestore();

module.exports = { admin, db };