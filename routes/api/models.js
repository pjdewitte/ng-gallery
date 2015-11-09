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
var multipart = require('connect-multiparty');
var nodemailer = require('nodemailer');
var flowFactory = require('../flow');
var express = require('express');
var request = require('request');
var mongo = require('mongodb');
var path = require('path');
var rm = require('rimraf');
var _ = require('lodash');
var fs = require('fs');

module.exports = function(db, config, lmv) {

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

  /////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////
  router.post('/upload',
    multipart(),
    function (req, res) {

      if (!req.isAuthenticated()) {

        res.status(401); //Unauthorized
        res.send({'error': 'Unauthorized'});
        return;
      }

      var flow = flowFactory.createFlow(
        'data/',
        'temp');

      flow.post(req, {useChunks: true},
        function (status,
                  filename,
                  original_filename,
                  identifier) {

          res.status(status).send();
        });
    });

  /////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////
  var keyMap = {};

  var host = null;

  router.post('/register/:filename', function (req, res) {

    host = req.query.host;

    var filename =  req.params.filename;

    var stream = fs.createWriteStream(
      'data/temp/' + filename);

    var flow = flowFactory.createFlow(
      'data/',
      'temp');

    var objectKey = guid() + '.' + getFileExt(filename);

    var fileId = 'urn:adsk.objects:os.object:' +
      config.bucketKey + '/' +
      objectKey;

    keyMap[objectKey] = {
      name: getFileName(filename),
      fileId:  fileId,
      urn: lmv.toBase64(fileId),
      states: [],
      sequence: [],
      author: req.user
    };

    flow.write(filename, stream, {
      end: true,
      useChunks: true,
      deleteSource: true,
      objectKey: objectKey,
      onDone: onRegisterFile
    });

    res.json({urn: keyMap[objectKey].urn});
  });

  function onRegisterFile(file, options) {

    var bucketData = {
      bucketKey : config.bucketKey,
      servicesAllowed: {},
      policy: 'persistent'
    };

    lmv.getBucket(config.bucketKey, true, bucketData).then(
      function(response) {

        var filename = 'data/temp/' + file;

        lmv.resumableUpload(
          filename,
          config.bucketKey,
          options.objectKey).then(
          function(results){

            fs.unlink(filename);

            var fileId = results[0].objects[0].id;

            onUploadCompleted(fileId);
          },
          function(error){

            delete keyMap[options.objectKey];

            fs.unlink(filename);

            console.log(error);
          });
      },
      function(error){

        delete keyMap[options.objectKey];
        console.log(error)
      });
  }

  function onUploadCompleted(fileId) {

    var objectKey = fileId.split('/')[1];

    var urn = lmv.toBase64(fileId);

    lmv.register(urn, true).then(
      function(registerResponse){

        if (registerResponse.Result === "Success") {

          lmv.checkTranslationStatus(
            urn,
            1000 * 60 * 60 * 24, //24h timeout
            10000).then(
            onTranslationCompleted,
            function (error) {

              delete keyMap[objectKey];
              console.log(error);
            });
        }
      },
      function(error){

        delete keyMap[objectKey];
        console.log(error);
      });
  }

  function onTranslationCompleted(translationResponse) {

    var urn = translationResponse.urn;

    var fileId = lmv.fromBase64(urn);

    var objectKey = fileId.split('/')[1];

    var modelInfo = keyMap[objectKey];

    delete keyMap[objectKey];

    console.log("Translation successful: " +
      modelInfo.name + " - FileId: " +
      modelInfo.fileId);

    db.collection('gallery.models', function (err, collection) {
      collection.insert(
        modelInfo,
        {safe: true},

        function (err, result) {

          if (err) {

            console.log(err);
            return;
          }

          var url = 'http://' + host +
            '/#/viewer?id=' + modelInfo._id;

          var emailInfo = {
            url: url,
            email: getUserEmail(modelInfo.author)
          };

          sendMail(emailInfo, modelInfo);

          lmv.getThumbnail(urn).then(
            function(thumbnailResponse){

              var thumbnailInfo = {
                modelId: modelInfo._id,
                data: thumbnailResponse
              }

              addThumbnail(thumbnailInfo);
            },
            function(error){

              console.log(error);
            });
        });
    });
  }

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  function getFileExt(file) {

    var res = file.split('.');

    return res[res.length - 1];
  }

  function getFileName(file) {

    var ext = getFileExt(file);

    var name = file.substring(0,
      file.length - ext.length - 1);

    return name;
  }

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  function guid() {

    var d = new Date().getTime();

    var guid = 'xxxx-xxxx-xxxx-xxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });

    return guid;
  }

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

  /////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////
  router.get('/:modelId', function (req, res) {

    var modelId = req.params.modelId;

    if (modelId.length !== 24) {
      res.status(404);
      res.send(null);
      return;
    }

    var fields = {
      name: 1,
      urn: 1
    };

    if(config.offline) fields.viewablePath = 1;

    db.collection('gallery.models', function (err, collection) {

      collection.findOne(
        {'_id': new mongo.ObjectId(modelId)},
        fields,

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

    if(config.offline) pageQuery.viewablePath = 1;

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
        function (err, models) {

          if (err) {
            res.status(204); //HTTP 204: NO CONTENT
            res.err = err;
          }

          models.forEach(function (model) {

            model.downloadable = config.offline;

            model.allowDelete = config.allowDelete;
          });

          res.jsonp(models);
        });
    });
  });

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
  function addThumbnail(thumbnailInfo) {

    db.collection('gallery.thumbnails', function (err, collection) {

      collection.insert(
        thumbnailInfo,
        {safe: true},
        function (err, result) {

        });
    });
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  function sendMail(emailInfo, modelInfo) {

    var transporter = nodemailer.createTransport(transport({
      name: 'smtp.orange.fr'
    }));

    var text = "You have successfully uploaded a new model:" +
      "\n\nModel name:\n" + modelInfo.name +
      "\n\nFile Id:\n" + modelInfo.fileId +
      "\n\nModel urn:\n" + modelInfo.urn;

    var html = "You have successfully uploaded a new model:" +
      "<br><br><b>Model name:</b><br>" + modelInfo.name +
      "<br><br><b>File Id:</b><br>" + modelInfo.fileId +
      "<br><br><b>Model urn:</b><br>" + modelInfo.urn +
      "<br><br>" + '<a href=' + emailInfo.url + '>View on the Gallery</a>';

    transporter.sendMail({
      from: 'View & Data API Gallery <no-reply@autodesk.com>',
      replyTo: 'no-reply@autodesk.com',
      to: emailInfo.email,
      subject: "Model upload notification",
      text: text,
      html: html
    });

    transporter.close();
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/download/:modelId', function (req, res) {

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

          if(!err) {

            res.jsonp('pending');

            lmv.download(model.urn, 'downloads/' + modelId).then(

              function(items){

                var path3d = items.filter(function(item){
                  return item.type === '3d';
                });

                var path2d = items.filter(function(item){
                  return item.type === '2d';
                });

                model.viewablePath = _.flatten([path3d, path2d]);

                collection.update(
                  {'_id': new mongo.ObjectID(modelId)},
                  {$set: {"viewablePath": model.viewablePath}},
                  {safe: true},
                  function (err2, cmdResult) {

                  });
              },

              function(error) {

                console.log('Error downloading model: ' + modelId);
                console.log(error);
              }
            );
          }
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.post('/drop/:modelId', function (req, res) {

    var modelId = req.params.modelId;

    if (modelId.length !== 24) {
      res.status(404);
      res.send(null);
      return;
    }

    db.collection('gallery.models', function (err, collection) {

      collection.findOne(
        {'_id': new mongo.ObjectId(modelId)},
        {viewablePath: 1},

        function (err, model) {

          if (!err) {

            rm('downloads/' + modelId, function () {

              delete model.viewablePath;

              collection.update(
                {'_id': new mongo.ObjectID(modelId)},
                {$set: {"viewablePath": null}},
                {safe: true},
                function (err2, cmdResult) {

                  res.jsonp(model);
                });
            });
          }
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.post('/delete', function (req, res) {

    if(!config.allowDelete) {
      res.status(401);
      res.json('unauthorized');
      return;
    }

    var payload = req.body;

    var modelId = payload.modelId;

    if (modelId.length !== 24) {
      res.status(400);
      res.send(null);
      return;
    }

    db.collection('gallery.models', function (err, collection) {

      var queryParams = {_id: new mongo.ObjectId(modelId)};

      collection.remove(
        queryParams,
        null,
        function (error, result) {

          if (error) {

            res.status(400);
            res.json(error);
          }
          else {

            res.json(modelId);
          }
        }
      );
    });
  });

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
