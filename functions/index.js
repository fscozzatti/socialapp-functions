const functions = require("firebase-functions");
const express = require("express");
const firebase = require("firebase");
const app = express();
const { getAllScreams, postOneScream } = require('../functions/handlers/screams');
const { signup, login, uploadUserImage } = require('../functions/handlers/users')
const FBAuth = require('../functions/util/fbAuth')
// Screams Route
app.get('/screams', getAllScreams );
app.post('/scream', FBAuth, postOneScream);
//Signup route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadUserImage);
  
exports.api = functions.https.onRequest(app);