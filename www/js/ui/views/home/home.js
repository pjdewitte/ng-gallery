///////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2015 - ADN/Developer Technical Services
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
///////////////////////////////////////////////////////////////////////////
'use strict';

//////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.View.Home', [])

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/home', {
      templateUrl: './js/ui/views/home/home.html',
      controller: 'Autodesk.ADN.NgGallery.View.Home.Controller'
    });
  }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.View.Home.Controller',

  ['$scope', 'ViewAndData', 'Model', 'Thumbnail', 'AppState', 'Toolkit',
    function($scope, ViewAndData, Model, Thumbnail, AppState, Toolkit) {

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.searchFilter = function (model) {

        var regExp = new RegExp($scope.modelsFilterValue, 'i');

        return !$scope.modelsFilterValue ||
          regExp.test(model.name);
      }

      ///////////////////////////////////////////////////////////////////
      // Cannot rely on angular filtering to be compatible with stroll.js
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$watch('modelsFilterValue', function() {

        filterItems();
      });

      function filterItems() {

        var filter = $scope.modelsFilterValue;

        var colors = ['rgba(124, 183, 155, 0.42)', 'rgba(66, 151, 111, 0.69)'];

        var idx = 0;

        var $items = $("li.model-item");

        if($items.length) {

          $items.each(function () {

            var $item = $(this);

            if (!filter.length || $item.text().toLowerCase().indexOf(
                filter.toLowerCase()) > 0) {

              $item.find('> .row').css({
                'background-color': colors[(idx++) % 2]
              });

              $item.css({
                'display': 'block'
              });
            }
            else {

              $item.css({
                'display': 'none'
              });
            }
          });

          if (!AppState.mobile) {
            stroll.bind('.stroll');
          }
        }
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function loadModels(done) {

        //fetches 10 models at a time

        var limit = 10;

        var skip = 0;

        loadModelsRec(skip, limit, done);
      }

      function loadModelsRec(skip, limit, done) {

        Model.query({skip: skip, limit:limit}, function(models) {

            models.forEach(function(model) {

              try {

                // set as default
                model.thumbnail = "img/adsk/adsk-128x128-32.png";

                $scope.models.push(model);

                Thumbnail.get({modelId: model._id},
                  function (response) {
                    model.thumbnail =
                      "data:image/png;base64," + response.thumbnail.data;
                  });
              }
              catch (ex) {
                console.log(ex);
              }
            });

            filterItems();

            if(models.length == limit) {

              loadModelsRec(skip + limit, limit, done);
            }
            else {

              done();
            }
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function onModelsLoaded() {

        ViewAndData.client.onInitialized(function() {

          $scope.models.forEach(function(model) {

            var fileId = ViewAndData.client.fromBase64(model.urn);

            // role
            ViewAndData.client.getSubItemsWithProperties(
              fileId,
              {type: 'geometry'},
              function (items) {
                if (items.length > 0) {
                  model.type = items[0].role;
                }
              },
              function (error) {

              }
            );

            //progress
            ViewAndData.client.getViewable(
              fileId,
              function (viewable) {

                model.progress = viewable.progress;
              },
              function (error) {

              }, 'status');
          });
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.download = function (model) {

        $.get('api/models/download/' + model._id, function(response) {

          model.downloading = true;

          //simple polling every 5 sec
          var pollingId = setInterval(function() {

            $.get('api/models/' + model._id, function(response) {

              if(response.viewablePath) {

                model.viewablePath = response.viewablePath;

                model.downloading = false;

                clearInterval(pollingId);
              }
            });
          }, 5000);
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.drop = function (model) {

        $.post('api/models/drop/' + model._id, function(response){

          model.viewablePath = null;
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.delete = function (model) {

        var args = {
          eventId: Toolkit.guid(),
          model: model,
          caption: 'Delete Model',
          message: "Are you sure you want to delete this model?" +
          "<br> <b>" + model.name + "</b>"
        };

        $scope.$emit('app.EmitMessage', {
          msgId:'dlg.itemDlg',
          msgArgs: args
        });

        var listener = $scope.$on(args.eventId,

          function (event, data) {

            var modelId = data.args.callingArgs.model._id;

            var payload = {
              modelId: modelId
            };

            Model.delete(JSON.stringify(payload),
              function (response) {

              });

            $scope.models.forEach(function(model, idx){

              if(modelId === model._id) {

                $scope.models.splice(idx, 1);
                return;
              }
            });

            listener();
          });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      AppState.pageTitle = 'View & Data Gallery';

      $scope.modelsFilterValue = '';

      AppState.activeView = 'home';

      AppState.showNavbar = true;

      $scope.models = [];

      $(window).resize(function(){

        if (!AppState.mobile) {
          stroll.bind('.stroll');
        }
      });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      loadModels(onModelsLoaded);

    }]);
