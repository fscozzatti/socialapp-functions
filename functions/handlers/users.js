const { admin, db } = require('../util/admin');
const firebase = require('firebase');
const firebaseConfig = require('../util/config');

firebase.initializeApp(firebaseConfig);

const { validateSignupData, validateLoginData } = require('../util/validator')

exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    const { valid, errors } = validateSignupData(newUser);
    if(!valid){ return res.status(400).json(errors)};

    const noImg = 'no-img.png'
    let token, userId;

    db.doc(`/users/${newUser.handle}`).get()
        .then((doc) => {
            if(doc.exists){
                return res.status(400).json('this handle is already exist')
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
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImg}?alt=media`,
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

  }

  exports.login = (req, res) => {

    const userLog = {
        email: req.body.email,
        password: req.body.password
    };

    const { valid, errors } = validateLoginData(userLog);
    if(!valid){ return res.status(400).json(errors)};
 

    firebase.auth().signInWithEmailAndPassword(userLog.email, userLog.password)
    .then( data => {
        return data.user.getIdToken() 
    }).then( token => {
        return res.json({token})
    }).catch( err => {
        console.error(err);
        if( err.code === 'auth/wrong-password'){
            res.status(403).json({general: "Wrong credentials, please try again"})
        }else{
        return res.status(500).json({error: err.code})}
    });
  }

exports.uploadUserImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', ( fieldname, file, filename, encoding, mimetype) => {
        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png'){
            res.status(400).json({error:'Wrong file type submitted'})
        }
        //my.image.png
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        //222311455445.png
        imageFileName = `${Math.round(Math.random()*1000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload( imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
        })
        .then(() => {
            return res.json({ message:'Image uploaded successfully'});
        })
        .catch( (err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
    });
    busboy.end(req.rawBody);
}