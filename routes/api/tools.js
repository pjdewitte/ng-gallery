/**
 * Created by leefsmp on 6/9/15.
 */

var express = require('express');
var request = require('request');
var mongo = require('mongodb');
var async = require('async');
var oboe = require('oboe');
var fs = require('fs');

module.exports = function(db, lmv) {

  var router = express.Router();

  ///////////////////////////////////////////////////////////////////////////////
  // Used to get all models data (/models?skip=$&limit=$)
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/models', function (req, res) {

    var pageQuery = {};

    var fieldQuery = {};

    if (typeof req.query.skip !== 'undefined')
      pageQuery.skip = req.query.skip;

    if (typeof req.query.limit !== 'undefined')
      pageQuery.limit = req.query.limit;

    db.collection('gallery.models', function (err, collection) {
      collection.find(fieldQuery, pageQuery)
        .sort({name: 1}).toArray(
        function (err, items) {

          var response = items;

          if (err) {
            res.status(204); //HTTP 204: NO CONTENT
            res.err = err;
          }

          res.json(response);
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/models/:modelId', function (req, res) {

    var modelId = req.params.modelId;

    if (modelId.length !== 24) {
      res.status(404);
      res.send(null);
      return;
    }

    db.collection('gallery.models', function (err, collection) {

      collection.findOne(
        {'_id': new mongo.ObjectId(modelId)},
        {},

        function (err, model) {

          res.status((model ? 200 : 404));
          res.jsonp(model);
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  // Used to get all extensions data
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/extensions', function (req, res) {

    db.collection('gallery.extensions', function (err, collection) {
      collection.find()
        .sort({name: 1}).toArray(
        function (err, items) {

          var response = items;

          if (err) {
            res.status(204); //HTTP 204: NO CONTENT
            res.err = err;
          }

          res.json(response);
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  // Used to get all users
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/users', function (req, res) {

    db.collection('gallery.users', function (err, collection) {
      collection.find()
        .sort({name: 1}).toArray(
        function (err, items) {

          var response = items;

          if (err) {
            res.status(204); //HTTP 204: NO CONTENT
            res.err = err;
          }

          res.json(response);
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  // Used to get all thumbnails
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/thumbnails', function (req, res) {

    db.collection('gallery.thumbnails', function (err, collection) {
      collection.find()
        .sort({name: 1}).toArray(
        function (err, items) {

          var response = items;

          if (err) {
            res.status(204); //HTTP 204: NO CONTENT
            res.err = err;
          }

          res.json(response);
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  // Used to migrate the data model
  //
  ///////////////////////////////////////////////////////////////////////////////
  function guid() {

    var d = new Date().getTime();

    var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });

    return guid;
  }

  router.get('/migrate', function (req, res) {

    db.collection('gallery.models', function (err, collection) {
      collection.find().toArray(
        function (err, models) {

          models.forEach(function (model) {

            collection.update(
              {'_id': model._id},
              model,
              {safe: true},
              function (err2, result) {

              });
          });

          res.send('ok');
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/thumbnails/generate', function (req, res) {

    db.collection('gallery.models', function (err, collection) {
      collection.find()
        .sort({name: 1}).toArray(
        function (err, items) {

          db.collection('gallery.thumbnails', function (err, thumbColl) {

            items.forEach(function (model) {

              lmv.getThumbnail(
                model.urn).then(
                function (data) {

                  var newThumbnail = {
                    modelId: new mongo.ObjectId(model._id),
                    data: data
                  };

                  console.log('Updating thumbnail: ' + model.name);

                  thumbColl.update(
                    {'modelId': newThumbnail.modelId},
                    newThumbnail,
                    {upsert: true},
                    function (err3, cmdResult) {

                    });
                });
            });

          });

          if (err) {
            res.status(204); //HTTP 204: NO CONTENT
            res.err = err;
          }

          res.json('ok');
        });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  // backup all collections
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/backup', function (req, res) {

    var dir = 'db-backup';

    var collections = [
      'gallery.models',
      'gallery.users',
      'gallery.extensions'];

    collections.forEach(function(collection){

      backupCollection(collection, dir + '/' + collection + '.json');
    });

    res.json('ok');
  });

  function backupCollection(collectionName, outputFile) {

    db.collection(collectionName, function (err, collection) {
      collection.find()
        .sort({name: 1}).toArray(
        function (err, items) {

          if (err) {
            return;
          }

          fs.writeFile(outputFile,
            JSON.stringify(items, null, 2),
            function(err) {
              if(err) {
                console.log(err);
              } else {
                console.log(outputFile + ' saved');
              }
            });
        });
    });
  }

  ///////////////////////////////////////////////////////////////////////////////
  // restore all collections
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/restore/:drop', function (req, res) {

    var drop = req.params.drop;

    var dir = 'db-backup';

    var collections = [
      //'gallery.models',
      //'gallery.users',
      'gallery.extensions'
    ];

    collections.forEach(function(collection){

      if(drop){

        db.collection(collection, function (err, dbCollection) {

          dbCollection.drop(function (errDrop, result) {

            restoreCollection(collection,
              dir + '/' + collection + '.json');
          });
        });
      }
      else{

        restoreCollection(collection,
          dir + '/' + collection + '.json');
      }
    });

    res.json('ok');
  });

  function restoreCollection(collectionName, intputFile, drop) {

    db.collection(collectionName, function (err, collection) {

      collection.find()
        .sort({name: 1}).toArray(
        function (err, items) {

          oboe(fs.createReadStream(intputFile))
            .on('node', {
              '![*]': function(item) {

                item._id = new mongo.ObjectID(item._id);

                collection.update(
                  {'_id': item._id},
                  item,
                  {upsert: true},
                  function (err2, result) {

                    if(err2)
                      console.log('Failed to upsert item: ' + item._id);

                    else
                      console.log('Upsert item: ' + item._id);
                  });
              }
            })
            .on('done', function(){
              console.log("Collection restored: " + collectionName);
            })
            .on('fail', function(){
              console.log("Collection restore FAILED: " + collectionName);
            });
        });
    });
  }

  return router;
}



















