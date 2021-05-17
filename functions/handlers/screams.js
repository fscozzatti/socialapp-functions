const { db } = require('../util/admin');

exports.getAllScreams = (req, res) => {
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
     };

exports.postOneScream =  (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString(),
    };

    db.collection('screams').add(newScream)
    .then((doc) => {
      res.json({ message:`document ${doc.id} created successfully` });
    }).catch( err =>{ 
      res.status(500).json({ error: 'something went wrong' });
      console.error(error);
      });
};

exports.getScream = (req, res) => {
    let screamData = {};

    db.doc(`screams/${req.params.screamId}`)
    .get()
    .then((doc) =>{
        if(!doc.exists){
            return res.status(404).json({error: "Scream not found"})
        }
        screamData = doc.data();
        screamId = doc.id;
        return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('screamId','==', req.params.screamId)
        .get();
    })
    .then((data) => {
        screamData.comments = [];
        data.forEach((doc) =>{
            screamData.comments.push(doc.data());
        });
        return res.json(screamData);
    })
    .catch( err =>{ 
        res.status(500).json({ error: err.code });
        console.error(error);
     });
}