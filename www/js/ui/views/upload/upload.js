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

var configClient = require("../../../config-client");

//////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.View.Upload',
  [
    'ngRoute'
  ])

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/upload', {
      templateUrl: './js/ui/views/upload/upload.html',
      controller: 'Autodesk.ADN.NgGallery.View.Upload.Controller'
    });
  }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.View.Upload.Controller',

  ['$scope', '$http', 'AppState', 'ViewAndData', 'Toolkit', 'Model',
    function($scope, $http, AppState, ViewAndData, Toolkit, Model) {

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      if(!AppState.isAuthenticated) {
        $scope.$emit('app.EmitMessage', {
          msgId: 'dlg.login',
          msgArgs: {
            caption: 'This feature requires log in ...'
          }
        });
      }

      $scope.flowIdentifier = function (file) {

        return file.name;
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      AppState.pageTitle = 'View & Data Gallery';

      AppState.activeView = 'upload';

      AppState.showNavbar = true;

      $scope.uploader = {};

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function createFileNode(file, parent) {

        var node = {
          href: null,
          file: file,
          label: file.name,
          children: [],
          parent: parent,
          progress: '0%',
          selectable: false,
          progressText: file.name + ' - Queuing for upload ...'
        };

        if (parent) {

          parent.children.push(node);
        }
        else {

          $scope.nodes.push(node);
        }

        return node;
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      $scope.onNodeSelected = function(node, selected) {

        if($scope.selectedNode) {

          $scope.selectedNode.selected = false;

          $scope.selectedNode = null;
        }

        node.selected = selected && node.selectable;

        if(selected && node.selectable) {

          $scope.selectedNode = node;
        }
      };

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      $scope.onUpload = function() {

        if(!AppState.isAuthenticated) {
          $scope.$emit('app.EmitMessage', {
            msgId: 'dlg.login',
            msgArgs: {
              caption: 'This feature requires log in ...'
            }
          });

          return;
        }

        $scope.uploader.flow.upload();

        reset();
      };

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      $scope.uploads = [];

      $scope.treeOptions = {

        multiSelection: false,
        nodeChildren: "children",
        dirSelectable: true,

        injectClasses: {
          "ul": "c-ul",
          "li": "c-li",
          "liSelected": "c-liSelected",
          "iExpanded": "c-iExpanded",
          "iCollapsed": "c-iCollapsed",
          "iLeaf": "c-iLeaf",
          "label": "c-label",
          "labelSelected": "c-labelSelected"
        }
      };

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function reset() {

        $scope.dropMessage = "Drop design files to upload ...";

        $scope.selectedNode = null;

        $scope.expandedNodes = [];

        $scope.nodes = [];
      }

      ///////////////////////////////////////////////////////////////////////
      // Utilities
      //
      ///////////////////////////////////////////////////////////////////////
      function getProgress(progress) {

        if(progress === 'complete')
          return '100%';

        var res = progress.split('%');

        return res[0] + '%';
      }

      ///////////////////////////////////////////////////////////////////////
      // upload events
      //
      ///////////////////////////////////////////////////////////////////////
      var nodeMap = {};

      $scope.onFileAdded = function($file, $event, $flow) {

        $scope.dropMessage = "";

        var node = createFileNode($file, $scope.selectedNode);

        nodeMap[$file.name] = node;

        $scope.uploads.push(node);
      }

      $scope.onFilesAdded = function($files, $event, $flow) {

        //console.log($files)
      }

      $scope.onFileSuccess = function($file, $message, $flow) {

        var node = nodeMap[$file.name];

        node.progressText = $file.name + ' - Queuing for translation ...';

        node.progress = '0%';

        $http.post(configClient.ApiURL +
          '/models/register/' + $file.name).then(
          function(response){

            var urn = response.data.urn;

            checkTranslationStatus($file.name,
              urn,
              1000 * 60 * 60 * 24, //24h timeout
              2000,
              progressCallback).then(
              function(statusResponse) {

                var interval = setInterval(function () {

                  $http.get(configClient.ApiURL +
                  '/models?field=urn&value=' + urn).then(
                    function (response) {

                      if(response.data.length){

                        var model = response.data[0];

                        node.progressText += ' -';

                        node.href = 'http://' + window.location.host +
                          configClient.host + '/#/viewer?id=' + model._id;

                        clearInterval(interval);
                      };
                    });
                }, 2000);
              });
          });
      }

      $scope.onFileProgress = function($file, $flow) {

        var node = nodeMap[$file.name];

        node.progress = ($file.progress() * 100).toFixed(1) + '%';

        node.progressText = $file.name +
          ' - Uploading (' + node.progress + ')';
      }

      $scope.onUploadComplete = function() {

        //console.log($scope.uploader.flow.files);
      }

      $scope.onProgress = function() {


      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function progressCallback(filename, progress) {

        var node = nodeMap[filename];

        node.progress = getProgress(progress);

        node.progressText = filename +
          ' - Translating (' + node.progress + ')';
      }

      function checkTranslationStatus(
        filename, urn, timeout, period, progressCallback) {

        var promise = new Promise(function(resolve, reject) {

          var startTime = new Date().getTime();

          var timer = setInterval(function () {

            var dt = (new Date().getTime() - startTime) / timeout;

            if (dt >= 1.0) {

              clearInterval(timer);

              reject({error: 'timeout'});
            }
            else {

              var fileId = ViewAndData.client.fromBase64(urn);

              ViewAndData.client.getViewable(fileId,
                function (response) {

                  if(progressCallback)
                    progressCallback(filename, response.progress);

                  if (response.progress === 'complete') {

                    clearInterval(timer);

                    resolve(filename);
                  }
                },
                function (error) {

                  //reject(error);
                });
            }
          }, period);
        });

        return promise;
      };

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      reset();

    }]);
