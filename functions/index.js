const functions = require('firebase-functions');
const app = require('express')();

const { 
    getAllScreams,
    postOneScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
     } = require('./handlers/screams');

const { 
    signup,
    login,
    uploadUserImage,
    addUserDetails,
    getAuthenticatedUser } = require('./handlers/users');
 
const FBAuth = require('./util/fbAuth');
const { db } = require('./util/admin');


// Screams Route
app.get('/screams', getAllScreams );
app.get('/scream/:screamId', getScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.post('/scream', FBAuth, postOneScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);



//Signup route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadUserImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

  
exports.api = functions.region('us-central1').https.onRequest(app);

exports.createNotificationOnLike = functions
.region('us-central1')
.firestore.document('likes/{id}')
.onCreate((snapshot) =>{
    db.doc(`/screams/${snapshot.data().screamId}`)
    .get()
    .then((doc) => {
        if(doc.exists){
            db.doc(`/notifications/${snapshot.id}`).set({
                createAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                screamId: doc.id
            });
        }
    })
    .then(() =>{
        return;
    })
    .catch( err => {
        console.error(err);
        return;
    })
})

exports.deleteNotificationOnUnlike = functions
.region('us-central1')
.firestore.document('likes/{id}')
.onDelete((snapshot) =>{
        db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .then(() =>{
            return;
        })
        .catch( err => {
            console.error(err);
            return;
        })
})


exports.createNotificationOnComment = functions
.region('us-central1')
.firestore.document('comments/{id}')
.onCreate((snapshot) =>{
    db.doc(`/screams/${snapshot.data().screamId}`)
    .get()
    .then((doc) => {
        if(doc.exists){
            db.doc(`/notifications/${snapshot.id}`).set({
                createAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'comment',
                read: false,
                screamId: doc.id
            });
        }
    })
    .then(() =>{
        return;
    })
    .catch( err => {
        console.error(err);
        return;
    })
})