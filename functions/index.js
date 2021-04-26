const functions = require("firebase-functions");
const express = require("express");
const firebase = require("firebase");
const app = express();

firebase.initializeApp(firebaseConfig);
const { getAllScreams, postOneScream } = require('../functions/handlers/screams');
const { signup, login} = require('../functions/handlers/users')
const FBAuth = require('../functions/util/fbAuth')
// Screams Route
app.get('/screams', getAllScreams );
app.post('/scream', FBAuth, postOneScream);
//Signup route
app.post('/signup', signup);
app.post('/login', login);
  
exports.api = functions.https.onRequest(app);