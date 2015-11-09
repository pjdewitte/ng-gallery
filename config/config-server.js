/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2014 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////////
var local = new function() {

  this.user = '';
  this.pass = '';
  this.db = 'gallery',
  this.port = 27017;
  this.offline = true,
  this.allowDelete = true,
  this.dbhost = 'localhost';
  this.host = '/node/gallery';
  this.bucketKey = 'gallery-persistent-bucket';

  this.collaboration = {
    port: 5002
  },

  this.auth = {

    'facebookAuth': {
      'clientID': '',
      'clientSecret': '',
      'callbackURL': 'http://localhost:3000' + this.host + '/api/auth/facebook/callback'
    },

    'googleAuth': {
      'clientID': '',
      'clientSecret': '',
      'callbackURL': 'http://localhost:3000' + this.host + '/api/auth/google/callback'
    },

    'githubAuth': {
      'clientID': '',
      'clientSecret': '',
      'callbackURL': 'http://localhost:3000' + this.host + '/api/auth/github/callback'
    },

    'linkedInAuth': {
      'clientID': '',
      'clientSecret': '',
      'callbackURL': 'http://localhost:3000' + this.host + '/api/auth/linkedin/callback'
    }
  },

  this.lmvConfig = {
    credentials: {
      ConsumerKey: process.env.CONSUMERKEY,
      ConsumerSecret:process.env.CONSUMERSECRET
    }
  }
}



module.exports = local;