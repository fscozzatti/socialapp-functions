const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const firebase = require("firebase");
const { user } = require("firebase-functions/lib/providers/auth");
const app = express();
const firebaseConfig = {
    apiKey: "AIzaSyDZPfPfkZrY-AwQb-ylP1dFfAUlYWfYzMo",
    authDomain: "socialapp-fscozzatti.firebaseapp.com",
    databaseURL: "https://socialapp-fscozzatti-default-rtdb.firebaseio.com",
    projectId: "socialapp-fscozzatti",
    storageBucket: "socialapp-fscozzatti.appspot.com",
    messagingSenderId: "60001805920",
    appId: "1:60001805920:web:ef2e27a2e1765ab9da4505"
  };
;

firebase.initializeApp(firebaseConfig);
admin.initializeApp();

const db = admin.firestore()

app.get('/screams', (req, res) => {
   db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
        .then( data => {
            let screams = [];
            data.forEach( doc => {
                screams.push({
                    documentId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                });
            });
            return res.json(screams);
        }).catch(err => console.error(err));
    })

app.post('/scream' , (req, res) => {
      const newScream = {
          body: req.body.body,
          userHandle: req.body.userHandle,
          createdAt: new Date().toISOString(),
      };

      db.collection('screams').add(newScream)
      .then((doc) => {
        res.json({ message:`document ${doc.id} created successfully` });
      }).catch( err =>{ 
        res.status(500).json({ error: 'something went wrong' });
        console.error(error);
        });
  });

  const isEmail = (email) => {
      const regEx  = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
      if (email.match(regEx)){
          return true
      }else{
          return false
      }
  }

  const isEmpty = (string) => {
      if(string.trim() === ''){
          return true
      }else{
          return false
      }
  }

  app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }
    let errors = {};

    if (isEmpty(newUser.email)){
        errors.email = "Must not be empty"
    }else if(isEmail(newUser.email)){
        errors.email = "Must be a valid email address"
    }
    if (isEmpty(newUser.password)){
        errors.password = "Must not be empty"
    }
    if (newUser.password !== newUser.confirmPassword){
        errors.confirmPassword = "Password must be match"
    }
    if (isEmpty(newUser.handle)){
        errors.handle = "Must not be empty"
    }
    if(Object.keys(errors).length > 0){
        return res.status(400).json({errors})
    }

    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then((doc) => {
            if(doc.exists){
                return status(400).json('this handle is already exist')
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId: userId,
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then( () => {
            return res.status(201).json({ token })
        })
        .catch((err) => {
            console.error(error);
            if (err.code === 'auth/email-already-in-use'){
                return res.status(400).json({ email:'Email is already use'})
            }else{
                return res.status(500).json({ error: err.code })
            }
            
        })

  });

  exports.api = functions.https.onRequest(app);