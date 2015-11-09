/**
 * Created by leefsmp on 5/18/15.
 */

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LinkedInStrategy = require('passport-linkedin').Strategy;
var GithubStrategy = require('passport-github').Strategy;
var FbStrategy = require('passport-facebook').Strategy;

var passport = require("passport");
var express = require('express');
var request = require('request');
var mongo = require('mongodb');


module.exports = function(db, config) {

  var router = express.Router();

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {

    db.collection('gallery.users', function (err, collection) {
      collection.findOne(
        {'_id': new mongo.ObjectId(user._id)},
        function (err, user) {
          done(err, user);
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  function facebookUser(profile, token) {
    return {
      type: 'facebook',
      facebook: {
        id: profile.id,
        token: token,
        name: profile.name.givenName + ' ' + profile.name.familyName,
        email: profile.emails[0].value
      }
    }
  }

  function googleUser(profile, token) {
    return {
      type: 'google',
      google: {
        id: profile.id,
        token: token,
        name: profile.displayName,
        email: profile.emails[0].value
      }
    }
  }

  function githubUser(profile, token) {
    return {
      type: 'github',
      github: {
        id: profile.id,
        token: token,
        name: profile.displayName,
        email: profile.emails[0].value
      }
    }
  }

  function linkedInUser(profile, token) {
    return {
      type: 'linkedin',
      linkedin: {
        id: profile.id,
        token: token,
        name: profile.displayName,
        email: profile.emails[0].value
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  function onSocialResponse(token,
                            refreshToken,
                            profile,
                            done,
                            lookup,
                            userFunc) {

    process.nextTick(function () {

      db.collection('gallery.users', function (err, collection) {

        collection.findOne(
          lookup,
          function (errFind, user) {

            if (errFind)
              return done(errFind);

            if (user) {

              var updatedUser = userFunc(profile, token);

              collection.update(
                {'_id': user._id},
                updatedUser,
                {safe: true},
                function (errUpdate) {

                  return done(null, user);
                });
            }
            else {

              var newUser = userFunc(profile, token);

              collection.insert(
                newUser,
                {safe: true},
                function (errInsert) {
                  return done(null, newUser);
                });
            }
          });
      });
    });
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Facebook Strategy
  //
  ///////////////////////////////////////////////////////////////////////////////
  passport.use(new FbStrategy({

        clientID: config.auth.facebookAuth.clientID,
        clientSecret: config.auth.facebookAuth.clientSecret,
        callbackURL: config.auth.facebookAuth.callbackURL
      },

      function (token, refreshToken, profile, done) {

        onSocialResponse(
          token,
          refreshToken,
          profile,
          done,
          {'facebook.id': profile.id},
          facebookUser);
      })
  );

  router.get('/facebook', passport.authenticate(
      'facebook',
      {
        scope: 'email'
      })
  );

  router.get('/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: config.host + '/api/auth/loginok',
      failureRedirect: config.host + '/api/auth/loginerror'
    })
  );

  ///////////////////////////////////////////////////////////////////////////////
  // Google Strategy
  //
  ///////////////////////////////////////////////////////////////////////////////
  passport.use(new GoogleStrategy({

        clientID: config.auth.googleAuth.clientID,
        clientSecret: config.auth.googleAuth.clientSecret,
        callbackURL: config.auth.googleAuth.callbackURL
      },

      function (token, refreshToken, profile, done) {

        onSocialResponse(
          token,
          refreshToken,
          profile,
          done,
          {'google.id': profile.id},
          googleUser);
      })
  );

  router.get('/google', passport.authenticate(
      'google',
      {
        scope: ['profile', 'email']
      })
  );

  router.get('/google/callback',
    passport.authenticate('google', {
      successRedirect: config.host + '/api/auth/loginok',
      failureRedirect: config.host + '/api/auth/loginerror'
    }));

  ///////////////////////////////////////////////////////////////////////////////
  // Github Strategy
  //
  ///////////////////////////////////////////////////////////////////////////////
  passport.use(new GithubStrategy({

        clientID: config.auth.githubAuth.clientID,
        clientSecret: config.auth.githubAuth.clientSecret,
        callbackURL: config.auth.githubAuth.callbackURL
      },

      function (token, refreshToken, profile, done) {

        onSocialResponse(
          token,
          refreshToken,
          profile,
          done,
          {'github.id': profile.id},
          githubUser);
      })
  );

  router.get('/github', passport.authenticate(
      'github',
      {
        scope: ['user', 'email']
      })
  );

  router.get('/github/callback',
    passport.authenticate('github', {
      successRedirect: config.host + '/api/auth/loginok',
      failureRedirect: config.host + '/api/auth/loginerror'
    }));

  ///////////////////////////////////////////////////////////////////////////////
  // LinkedIn Strategy
  //
  ///////////////////////////////////////////////////////////////////////////////
  passport.use(new LinkedInStrategy({

        consumerKey: config.auth.linkedInAuth.clientID,
        consumerSecret: config.auth.linkedInAuth.clientSecret,
        callbackURL: config.auth.linkedInAuth.callbackURL,
        profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline']
      },

      function (token, refreshToken, profile, done) {

        onSocialResponse(
          token,
          refreshToken,
          profile,
          done,
          {'linkedin.id': profile.id},
          linkedInUser);
      })
  );

  router.get('/linkedin', passport.authenticate(
      'linkedin',
      {
        scope: ['r_basicprofile', 'r_emailaddress']
      })
  );

  router.get('/linkedin/callback',
    passport.authenticate('linkedin', {
      successRedirect: config.host + '/api/auth/loginok',
      failureRedirect: config.host + '/api/auth/loginerror'
    }));

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/logout', function (req, res) {
    req.logout();
    res.send('logged out');
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/loginok', function (req, res) {

    res.redirect(config.host + '');
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/loginerror', function (req, res) {

    res.send('error');
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/isAuthenticated', function (req, res) {

    var response = {
      user: (req.isAuthenticated() ? req.user : null)
    }

    res.send(response);
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  function isAuthenticated(req, res, next) {

    if (req.isAuthenticated())
      return next();

    res.status(401);
    res.send({error: 'unauthorized'});
  }

  return router;
}
