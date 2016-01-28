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

//config
var configClient = require("../../../config-client");


//////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.View.Extensions',
  [
    'ngRoute',
    'treeControl'
  ])

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/extensions', {
      templateUrl: './js/ui/views/extensions/extensions.html',
      controller: 'Autodesk.ADN.NgGallery.View.Extensions.Controller'
    });
  }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.View.Extensions.Controller',

  ['$scope', 'Extension', 'AppState', 'Upload',
    function($scope, Extension, AppState, Upload) {

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
      $scope.upload = function() {

        if(!AppState.isAuthenticated) {
          $scope.$emit('app.EmitMessage', {
            msgId: 'dlg.login',
            msgArgs: {
              caption: 'This feature requires log in ...'
            }
          });

          return;
        }

        $scope.newExtensionRootNode = null;

        $scope.newExtensionNodes = [];

        $scope.extDropMessage =
          "Uploading extension, please wait ...";

        Upload.uploadAll();
      };

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

      function createExtensionNode(extension, parent) {

        var node = {
          label: extension.name,
          children: [],
          parent: parent,
          selectable: false
        };

        if (parent)
          parent.children.push(node);

        return node;
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function refresh() {

        $scope.extensionNodes = [];

        Extension.query(function (extensions) {

          var root = {
            label: 'Gallery Extensions',
            children:[]
          };

          $scope.extensionNodes.push(root);

          extensions.forEach(function (extension) {

            createExtensionNode(extension, root);
          });
        });

        $scope.extDropMessage =
          "Drop extension file here (.js), then drop dependency" +
          " files if needed and hit Upload...";

        $scope.extension = null;
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

      $scope.onCancelUpload = function() {

        alert('cancel');
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function initializeDrop(id, dragOverClass){

        var dropzone = document.getElementById(id);

        dropzone.addEventListener('dragover', function (e) {

          e.currentTarget.classList.add(dragOverClass);
        });

        dropzone.addEventListener('dragleave', function (e) {

          e.currentTarget.classList.remove(dragOverClass);
        });

        dropzone.addEventListener('drop', function (e) {

          e.currentTarget.classList.remove(dragOverClass);

          e.preventDefault();
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function getExtensionFromFile(file, onSuccess, onError) {

        //converts extension name in readable format: CustomExt -> Cust Ext
        // SGPTest -> SGPTest
        function UpperCaseArray(input) {

          var result = input.replace(/([A-Z]+)/g, ",$1").replace(/^,/, "");
          return result.split(",");
        }

        function getExtensionDisplayName(id) {

          var idComponents = id.split('.');

          var nameComponents = UpperCaseArray(
            idComponents[idComponents.length - 1]);

          var name = '';

          nameComponents.forEach(function(nameComp){
            name += nameComp + ' ';
          });

          return name;
        }

        function findExtensionIds(str) {

          String.prototype.replaceAll = function (find, replace) {
            var str = this;
            return str.replace(new RegExp(
                find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'),
              replace);
          };

          String.prototype.trim = function () {
            return this.replace(/^\s+/, '').replace(/\s+$/, '');
          };

          var extensions = [];

          var start = 0;

          while(true) {

            start = str.indexOf(
              'theExtensionManager.registerExtension',
              start);

            if(start < 0) {

              return extensions;
            }

            var end = str.indexOf(',', start);

            var substr = str.substring(start, end);

            var ext = substr.replaceAll('theExtensionManager.registerExtension', '').
              replaceAll('\n', '').
              replaceAll('(', '').
              replaceAll('\'', '').
              replaceAll('"', '');

            extensions.push(ext.trim());

            start = end;
          }
        }

        var splits = file.name.split('.');

        if (splits[splits.length - 1] == 'js') {

          var reader = new FileReader();

          reader.onload = function (event) {

            var extensionIds = findExtensionIds(event.target.result);

            if(!extensionIds.length) {

              onError('No extension detected');
              return;
            }

            var id = extensionIds[0];

            var extension = {
              id: id,
              name: getExtensionDisplayName(id),
              file: file.name
            };

            onSuccess(extension);
          };

          reader.onerror = function (event) {

            onError('Cannot read file: ' + file.name);
          };

          reader.readAsBinaryString(file);
        }
        else {

          onError('Not a JavaScript file');
        }
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function initUpload() {

        Upload.initialize(
          '.flow-drop',
          '.flow-progress',
          '.progress-bar',
          '.flow-error',
          1024 * 1024 * 1024,
          function (file) {
            return file.name;
          }
        );

        ///////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////
        Upload.onFileAdded(function(flowFile) {

          var file = flowFile.file;

          if (!$scope.newExtensionRootNode) {

            getExtensionFromFile(file, function (extension) {

                $scope.extension = extension;

                $scope.extDropMessage = "";

                $scope.newExtensionRootNode = {
                  label: extension.id,
                  children: [],
                  selectable: false
                };

                createNode('Name: ' + extension.name,
                  $scope.newExtensionRootNode);

                createNode('Id: ' + extension.id,
                  $scope.newExtensionRootNode);

                createNode('File: ' + extension.file,
                  $scope.newExtensionRootNode);

                createNode('Dependencies',
                  $scope.newExtensionRootNode);

                Upload.setTarget(
                  configClient.ApiURL + '/extensions/upload/' +
                  extension.id);

                $scope.newExtensionNodes.push(
                  $scope.newExtensionRootNode
                );
              },
              function (error) {

                console.log(error);
              });
          }
          else {

            var dependenciesNode =
              $scope.newExtensionRootNode.children[3];

            createNode(flowFile.name,
              dependenciesNode);
          }
        });

        ///////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////
        Upload.onUploadStart(function () {

          console.log('onUploadStart');
        });

        ///////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////
        Upload.onUploadComplete(function () {

          console.log($scope.extension);

          var data = JSON.stringify($scope.extension);

          Extension.save(data, function (extensionResponse) {

            refresh();
          });
        });

        ///////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////
        Upload.onFileSuccess(function (file, message) {

          console.log('onFileSuccess:');
          console.log(file);
          console.log(message);
        });

        ///////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////
        Upload.onFileProgress(function (file, message) {

          console.log('onFileProgress:');
          console.log(file);
          console.log(message);
        });

        ///////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////
        Upload.onFileError(function (file, message) {

          console.log('onFileError:');
          console.log(file);
          console.log(message);
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      AppState.activeView = 'extensions';

      AppState.showNavbar = true;

      $scope.extensionNodes = [];

      $scope.expandedExtensionNodes = [];

      $scope.treeOptions = {

        multiSelection: true,
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

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.newExtensionNodes = [];

      $scope.newExtensionRootNode = null;

      $scope.expandedNewExtensionNodes = [];

      $scope.treeOptionsNewExt = {

        multiSelection: true,
        nodeChildren: "children",
        dirSelectable: true,

        injectClasses: {
          "ul": "c-ul-new-ext",
          "li": "c-li-new-ext",
          "liSelected": "c-liSelected-new-ext",
          "iExpanded": "c-iExpanded-new-ext",
          "iCollapsed": "c-iCollapsed-new-ext",
          "iLeaf": "c-iLeaf-new-ext",
          "label": "c-labe",
          "labelSelected": "c-labelSelected-new-ext"
        }
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      initializeDrop('extDrop', 'flow-dragover');

      initUpload();

      refresh();

    }]);