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

var transport = require('nodemailer-direct-transport');
var config = require('../../config/config-server');
var nodemailer = require('nodemailer');
var express = require('express');
var request = require('request');
var mongo = require('mongodb');

module.exports = function(db, viewAndDataClient) {

  var router = express.Router();

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/count', function (req, res) {

    db.collection('gallery.models', function (err, collection) {
      collection.count(function(err, count) {
        if (err) {
          res.status(404);
          res.send({error: 'An error has occurred'});
        }
        else {

          res.jsonp(count);
        }
      })});
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/:modelId', function (req, res) {

    var modelId = req.params.modelId;

    if (modelId.length !== 24) {
      res.status(404);
      res.send(null);
      return;
    }

    db.collection('gallery.models', function (err, collection) {

      collection.findOne(
        {'_id': new mongo.ObjectId(modelId)},
        {name: 1, urn: 1},

        function (err, model) {

          res.status((model ? 200 : 404));
          res.jsonp(model);
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/', function (req, res) {

    var pageQuery = {
      name: 1,
      urn: 1
    };

    var fieldQuery = {};

    if (typeof req.query.skip !== 'undefined')
      pageQuery.skip = req.query.skip;

    if (typeof req.query.limit !== 'undefined')
      pageQuery.limit = req.query.limit;

    if (typeof req.query.field !== 'undefined' &&
      typeof req.query.value !== 'undefined') {

      var field = req.query.field;

      var value = req.query.value;

      //case insensitive search
      var exp = ["^", value, "$"].join("");

      fieldQuery[field] = new RegExp(exp, "i");
    }

    db.collection('gallery.models', function (err, collection) {
      collection.find(fieldQuery, pageQuery)
        .sort({name: 1}).toArray(
        function (err, items) {

          var response = items;

          if (err) {
            res.status(204); //HTTP 204: NO CONTENT
            res.err = err;
          }

          res.jsonp(response);
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.post('/', function (req, res) {

    if (!req.isAuthenticated()) {

      res.status(401); //Unauthorized
      res.send({'error': 'Unauthorized'});
      return;
    }

    var host = req.query.host;

    var modelInfo = req.body;

    modelInfo.author = req.user;

    db.collection('gallery.models', function (err, collection) {
      collection.insert(
        modelInfo,
        {safe: true},

        function (err, result) {

          if (err) {

            res.status(404);
            res.send({'error': 'An error has occurred'});

          } else {

            res.send(modelInfo);

            var url = 'http://' + host +
              '/#/viewer?id=' + modelInfo._id;

            var emailInfo = {
              url: url,
              email: getUserEmail(req.user)
            };

            checkTranslationStatus(
              modelInfo.fileId,
              1000 * 60 * 60 * 24, //24h timeout
              function (viewable) {

                sendMail(emailInfo.url, emailInfo.email, modelInfo);

                getThumbnail(modelInfo);

                console.log("Translation successful: " +
                  modelInfo.name + " - FileId: " +
                  modelInfo.fileId);
              },
              function (error) {

                console.log(error);

                collection.remove(
                  { _id: new mongo.ObjectID(modelInfo._id) },
                  null,
                  function (error, result) {


                  });
              });
          }
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  function getUserEmail(user) {

    switch (user.type) {

      case "facebook":
        return user.facebook.email;

      case "google":
        return user.google.email;

      case "github":
        return user.github.email;

      case "linkedin":
        return user.linkedin.email;

      default:
        return "";
    }
  }

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  function getThumbnail(modelInfo) {

    viewAndDataClient.getThumbnail(
      modelInfo.fileId,
      function (data) {

        var thumbnail = {
          modelId: modelInfo._id,
          data: data
        }

        addThumbnail(thumbnail);
      },
      function (error) {

        console.log('getThumbnail error:' + error)
      });
  }

  ///////////////////////////////////////////////////////////////////////////////
  // add new thumbnail
  //
  // thumbnail:
  // {
  //      _id: id
  //      modelId: modelId
  //      data: thumbnail_base64
  // }
  //
  ///////////////////////////////////////////////////////////////////////////////
  function addThumbnail(thumbnail) {

    db.collection('gallery.thumbnails', function (err, collection) {

      collection.insert(
        thumbnail,
        {safe: true},

        function (err, result) {

        });
    });
  };

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  function checkTranslationStatus(fileId,
                                  timeout,
                                  onSuccess,
                                  onError) {

    var startTime = new Date().getTime();

    var timer = setInterval(function () {

      var dt = (new Date().getTime() - startTime) / timeout;

      if (dt >= 1.0) {

        clearInterval(timer);
        onError({error: 'timeout'});
      }
      else {

        viewAndDataClient.getViewable(
          fileId,
          function (response) {

            console.log(
              'Progress ' +
              fileId + ': ' +
              response.progress);

            if (response.progress === 'complete') {

              clearInterval(timer);

              onSuccess(response);
            }
          },
          function (error) {

            onError(error);
          });
      }
    }, 10000);
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  function sendMail(url, email, modelInfo) {

    var transporter = nodemailer.createTransport(transport({
      name: 'smtp.orange.fr'
    }));

    var text = "You have successfully uploaded a new model:" +
      "\n\nAuthor:\n" + modelInfo.author.name +
      "\n\nModel name:\n" + modelInfo.name +
      "\n\nFile Id:\n" + modelInfo.fileId +
      "\n\nModel urn:\n" + modelInfo.urn;

    var html = "You have successfully uploaded a new model:" +
      "<br><br><b>Author:</b><br>" + modelInfo.author.name +
      "<br><br><b>Model name:</b><br>" + modelInfo.name +
      "<br><br><b>File Id:</b><br>" + modelInfo.fileId +
      "<br><br><b>Model urn:</b><br>" + modelInfo.urn +
      "<br><br>" + '<a href=' + url + '>View on the Gallery</a>';

    transporter.sendMail({
      from: 'View & Data API Gallery <no-reply@autodesk.com>',
      replyTo: 'no-reply@autodesk.com',
      to: email,
      subject: "Model upload notification",
      text: text,
      html: html
    });

    transporter.close();
  }

  /*//////////////////////////////////////////////////////////////////////////////
   //
   //
   ///////////////////////////////////////////////////////////////////////////////
   router.param('modelId', function(req, res, next, modelId) {

   var modelId = req.params.modelId;

   if (modelId.length !== 24) {
   res.status(404);
   res.send(null);
   return;
   }

   db.collection('gallery.models', function (err, collection) {

   collection.findOne(

   { '_id': new mongo.ObjectId(modelId) },
   { },

   function (err, item) {

   if (err)
   return next(err);

   req.model = item;
   next();
   });
   });
   });


   ///////////////////////////////////////////////////////////////////////////////
   //
   //
   ///////////////////////////////////////////////////////////////////////////////
   router.get('/:modelId/states', function (req, res) {

   res.json(req.model.states);
   });

   ///////////////////////////////////////////////////////////////////////////////
   //
   //
   ///////////////////////////////////////////////////////////////////////////////
   router.put('/:modelId/states', function (req, res) {

   var data = req.body;

   var model = req.model;

   model.states.push(data.state);

   db.collection('gallery.models', function (err, collection) {

   collection.update(
   { '_id': model._id },
   { $set: {"states": model.states}},
   { safe: true },
   function (err, cmdResult) {

   res.json(model.states);
   });
   });
   });

   ///////////////////////////////////////////////////////////////////////////////
   //
   //
   ///////////////////////////////////////////////////////////////////////////////
   router.delete('/:modelId/states/:guid', function (req, res) {

   var model = req.model;

   var guid = req.params.guid;

   //removes states from model.states
   for(var i=0; i<model.states.length; ++i) {

   var stateObj = JSON.parse(model.states[i]);

   if(guid === stateObj.guid){
   model.states.splice(i, 1);
   break;
   }
   };

   db.collection('gallery.models', function (err, collection) {

   collection.update(
   { '_id': model._id },
   { $set: {"states": model.states}},
   { safe: true },
   function (err, cmdResult) {

   res.json(model.states);
   });
   });
   });*/

  return router;
}
