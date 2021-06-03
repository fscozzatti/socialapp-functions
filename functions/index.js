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
    getAuthenticatedUser,
    markNotificationRead,
    getUserDetails
     } = require('./handlers/users');
 
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
app.post('/notifications', FBAuth, markNotificationRead);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
 
exports.api = functions.region('us-central1').https.onRequest(app);

exports.createNotificationOnLike = functions
    .region('us-central1')
    .firestore.document('likes/{id}')
    .onCreate((snapshot) =>{
        return db.doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    screamId: doc.id
                });
            }
        })
        .catch( err => {
            console.error(err);
        })
})

exports.deleteNotificationOnUnlike = functions
    .region('us-central1')
    .firestore.document('likes/{id}')
    .onDelete((snapshot) =>{
            return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch( err => {
                console.error(err);
                return;
            })
})

exports.createNotificationOnComment = functions
    .region('us-central1')
    .firestore.document('comments/{id}')
    .onCreate((snapshot) =>{
        return db.doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: doc.id
                });
            }
        })
        .catch( err => {
            console.error(err);
            return;
        })
})

exports.onUserImageChange = functions
    .region('us-central1')
    .firestore.document('/users/{userId}')
    .onUpdate( (change) => {
        if( change.before.data().imageUrl !== change.after.data().imageUrl){
            let batch = db.batch();
            return db
                .collection('screams')
                .where('userHandle', '==', change.before.data().handle) 
                .get()
                .then( (data) => {
                    data.forEach( doc => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, { userImage: change.after.data().imageUrl});
                    });
                return batch.commit();
                });   
        } else return true;
    });

exports.onScreamDelete = functions
    .region('us-central1')
    .firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db.collection('comments').where('screamId', '==', screamId).get()
            .then( (data) => {
                data.forEach( (doc) => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                });
                return db
                .collection('likes')
                .where('screamId', '==', screamId)
                .get();
            })
            .then( (data) => {
                data.forEach( (doc) => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                });
                return db
                .collection('notifications')
                .where('screamId', '==', screamId)
                .get();
            })
            .then( (data) => {
                data.forEach( (doc) => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                });
                return batch.commit();
            })
            .catch( err => console.error(err));
    })