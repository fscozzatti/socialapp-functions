const functions = require('firebase-functions');
const app = require('express')();
const { 
    getAllScreams,
    postOneScream,
    getScream } = require('../functions/handlers/screams');
const { 
    signup,
    login,
    uploadUserImage,
    addUserDetails,
    getAuthenticatedUser } = require('../functions/handlers/users');
const FBAuth = require('../functions/util/fbAuth');

// Screams Route
app.get('/screams', getAllScreams );
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);


//Signup route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadUserImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

  
exports.api = functions.region('us-central1').https.onRequest(app);