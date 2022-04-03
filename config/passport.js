const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const connection = require('../database/dbconnection');
// Load User model
//const User = require('../models/User');
var user;
module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      connection.query('SELECT * FROM users WHERE userroll = "Admin" && username = ? ', [email], function(error, results, fields) {
        if (error) 
            return done(error);
           
          
        if(results.length==0)
        {
            return done(null,false,{ message: 'Invalid Credential' });
        }
     //   const isValid=validPassword(password,results[0].hash,results[0].salt);
        user={userid:results[0].userid,username:results[0].username,password:results[0].password,userroll:results[0].userroll};
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
    });
    
    })


  );
  passport.serializeUser(function(user, done) {
    done(null, user.userid);
  });

  passport.deserializeUser(function(userid, done) {
    connection.query('SELECT * FROM users where userid = ?',[userid], function(error, results) {
      done(null, results[0]);    
});
  });

};
