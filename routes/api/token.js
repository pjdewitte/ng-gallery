/////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////
var credentials = require('../../config/credentials');
var express = require('express');
var request = require('request');
var cors = require('cors');

module.exports = function(lmv) {

    var router = express.Router();

    ///////////////////////////////////////////////////////////////////////////////
    // Generates access token (production)
    //
    ///////////////////////////////////////////////////////////////////////////////
    router.get('/', function (req, res) {

        lmv.getToken().then(
          function(response){

              res.json(response);
          },
          function(error){

              res.status(error.statusCode || 404);
              res.json(error);
          });
    });

    ///////////////////////////////////////////////////////////////////////////////
    // cors enabled token
    //
    ///////////////////////////////////////////////////////////////////////////////
    var corsOptions = {

        origin: 'http://adndevblog.typepad.com'
    };

    router.get('/cors', cors(corsOptions), function (req, res, next) {

        lmv.getToken().then(
          function(response){

              res.json(response);
          },
          function(error){

              res.status(error.statusCode || 404);
              res.json(error);
          });
    });

    ///////////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////////
    router.get('/translator', function (req, res) {

        var params = {
            client_id: credentials.translator.client_id,
            client_secret:credentials.translator.client_secret,
            grant_type: 'client_credentials',
            scope: 'http://api.microsofttranslator.com'
        }

        request.post(
          credentials.translator.base_url,
          { form: params },

          function (error, response, body) {

              if (!error && response.statusCode == 200) {

                  res.send(JSON.parse(body));
              }
          });
    });

    return router;
}
