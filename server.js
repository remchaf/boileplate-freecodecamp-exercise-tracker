const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const { env } = require('./.env')

// MongoDb && Mongoose
// require('mongodb');
const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });


// Defining USER schema
const userSchema = new Schema({
  username: String,
  count: Number,
  log: [ Object ]
});
const USER = mongoose.model( 'USER', userSchema );



app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Using body-parser
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );



// app.use((req, res, next) => {
//   console.log(req.method, new Date().getSeconds());
//   next()
// });



// Handle POST and GET to /api/users route
app.post('/api/users', (req, res) => {

  const username = req.body.username;
  console.log(username);

  const user = new USER({
    username: username,
    count: 0,
    log: []
  });

  user.save( (err, doc) => {
    if(err) console.log(err);
    if(doc) res.json({
      username: username,
      _id: doc._id
    })
  } );
});

app.get('/api/users', (req, res) => {
  USER.find().select('_id username').exec( (err, doc) => {
    if(err) return 0;
    else if(doc) res.json(doc)
  } )
});



// Handle POST to /api/users/:_id/exercises
app.post( '/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id
  const { description, duration, date} = req.body;
  const dateString = !/(\d{4})-(\d{1,2})-(\d{1,2})/.test(date) ? new Date().toDateString() : new Date(date).toDateString();

  USER.findById( id, (err, doc) => {
    if(err) console.log(err);
    else {
      doc.count += 1;
      doc.log.push({
        description: description,
        duration: duration,
        date: dateString
      });

      doc.save( (err, d) => {
        if(err) return 0;
        else {
          res.json({
            username: d.username,
            _id: id,
            description: description,
            duration: Number(duration), 
            date: dateString
          })
        }
      } )
    }
  } )

} );


// Handle GET /api/users/:_id/logs
app.get('/api/users/:_id/logs', (req, res)=> {
  const { from, to, limit } = req.query;
  console.log(req.query)

  USER.findById( req.params['_id'], (err, doc) => {
    if(err) return 0;

    let logs = [ ...doc.log ]
    logs.forEach(el => {
      el.duration = Number(el.duration)
    });
    logs = logs.sort( (a, b) => new Date(a.date) - new Date(b.date) );
    console.log(logs)
    
    // Filter with from-to-limit query parameters
    if(from && to) {
      logs = logs.filter(a => new Date(a.date) > new Date(from) && new Date(a.date) < new Date(to))
    }
    if(limit) {
      logs = logs.slice(0, limit)
    }

    console.log(logs)
    // Sending the final object back
    res.send({
      count: doc.count,
      log: logs
    })
  } )
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
