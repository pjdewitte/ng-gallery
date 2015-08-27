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

  ['$scope', 'AppState', 'ViewAndData', 'Toolkit', 'Model',
    function($scope, AppState, ViewAndData, Toolkit, Model) {

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

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      AppState.pageTitle = 'View & Data Gallery';

      AppState.activeView = 'upload';

      AppState.showNavbar = true;

      var dropzone = document.getElementById('upload-dropzone');

      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.currentTarget.classList.add('over-line');
      });

      dropzone.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.currentTarget.classList.remove('over-line');
      });

      dropzone.addEventListener('drop', function (e) {

        e.stopPropagation();
        e.preventDefault();

       for(var i=0; i<e.dataTransfer.files.length; ++i) {

          var file = e.dataTransfer.files[i];

          createFileNode(file, $scope.selectedNode);
        }

        e.currentTarget.classList.remove('over-line');

        $scope.dropMessage = "";
      });

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function createNode(label, parent) {

        var node = {
          label: label,
          children: [],
          parent: parent,
          selectable: false
        };

        if (parent)
          parent.children.push(node);

        return node;
      }

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

        $scope.uploads = $scope.nodes;

        reset();

        ViewAndData.client.getBucketDetails(
          configClient.bucketName,
          function(response) {

            $scope.uploads.forEach(function(node) {

              uploadFile(node);
            });
          },
          function(error) {

            console.log(error);

            if( error.reason === "Bucket not found" ) {

              ViewAndData.client.createBucket(
                {
                  bucketKey : configClient.bucketName,
                  servicesAllowed: {},
                  policy: "persistent"
                },
                function(response) {

                  $scope.uploads.forEach(function(node) {

                    uploadFile(node);
                  });
                },
                function(error) {
                  console.log(error);
                });
            }
          });
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
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function uploadFile(node) {

        var file = node.file;

        node.progressText = file.name + ' - Uploading ...';

        console.log("Uploading file: " + file.name);

        var id = Toolkit.guid();

        ViewAndData.client.uploadFile(
          file,
          configClient.bucketName,
          id + '.' + getFileExt(file),

          function (uploadResponse) {

            var fileId = uploadResponse.objectId;

            node.progressText = file.name + ' - Upload successful ...';

            console.log("Upload successful: " + uploadResponse.file.name);

            ViewAndData.client.register(fileId,
              function(registerResponse) {

                node.progressText = file.name +
                  ' - Registration: ' +
                  registerResponse.Result;

                console.log("Registration result: " +
                  registerResponse.Result);

                var modelName = getFileName(uploadResponse.file);

                if (registerResponse.Result === "Success") {

                  var modelInfo = {
                    name: modelName,
                    fileId: fileId,
                    urn: ViewAndData.client.toBase64(fileId),
                    states: [],
                    sequence: []
                  };

                  Model.save(JSON.stringify(modelInfo), function (modelResponse) {

                    console.log("New model added to DB: " +
                      JSON.stringify(modelResponse));

                    var url = 'http://' + window.location.host +
                      configClient.host +
                      '/#/viewer?id=' + modelResponse._id;

                    checkTranslationStatus(
                      fileId,
                      1000 * 60 * 60, //60 mins timeout,
                      function(progress) {

                        node.progress = getProgress(progress);

                        node.progressText = modelName + " - Translation: " + progress;

                        console.log('Progress ' + modelName + ': ' + progress);
                      },
                      function (viewable) {

                        node.progressText += ' - ';

                        node.href = url;

                        console.log("Translation successful: " +
                          uploadResponse.file.name);

                        console.log(url);
                      });
                  });
                }
              },
              function(error) {

                node.progressText = file.name +
                  ' - Registration error: ' + error;

                console.log("Registration error: " + error);
              });
          },
          function (error) {

            node.progressText = file.name +
              ' - Upload error: ' + error;

            console.log("Upload error: " + error);
          });
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function checkTranslationStatus(fileId, timeout, onUpdate, onSuccess) {

        var startTime = new Date().getTime();

        var timer = setInterval(function () {

          var dt = (new Date().getTime() - startTime) / timeout;

          if (dt >= 1.0) {

            clearInterval(timer);
          }
          else {

            ViewAndData.client.getViewable(
              fileId,
              function (response) {

                onUpdate(response.progress);

                if (response.progress === 'complete') {
                  clearInterval(timer);
                  onSuccess(response);
                }
              },
              function (error) {

              });
          }
        }, 5000);
      }

      ///////////////////////////////////////////////////////////////////////
      // Utilities
      //
      ///////////////////////////////////////////////////////////////////////
      function getFileExt(file) {

        var res = file.name.split('.');

        return res[res.length - 1];
      }

      function getFileName(file) {

        var ext = getFileExt(file);

        var name = file.name.substring(0,
          file.name.length - ext.length - 1);

        return name;
      }

      function getProgress(progress) {

        if(progress === 'complete')
          return '100%';

        var res = progress.split('%');

        return res[0] + '%';
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      reset();

    }]);
