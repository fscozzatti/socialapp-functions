const functions = require('firebase-functions');
const app = require('express')();
const { 
    getAllScreams,
    postOneScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream } = require('../functions/handlers/screams');

const { 
    signup,
    login,
    uploadUserImage,
    addUserDetails,
    getAuthenticatedUser } = require('../functions/handlers/users');
    
const FBAuth = require('../functions/util/fbAuth');

// Screams Route
app.get('/screams', getAllScreams );
app.get('/scream/:screamId', getScream);
app.post('/scream', FBAuth, postOneScream);
app.post('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.post('/scream/:screamId/like', FBAuth, likeScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);



//Signup route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadUserImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

  
exports.api = functions.region('us-central1').https.onRequest(app);