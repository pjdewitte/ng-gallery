///////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////
'use strict';

require("../../../directives/viewer-directive");

var configClient = require("../../../config-client");

angular.module('Autodesk.ADN.NgGallery.View.ExtensionEditor',
  [
    'ngRoute',
    'ngSanitize',
    'ui.select',
    'ui-layout-events',
    'Autodesk.ADN.NgGallery.Service.Toolkit',
    'Autodesk.ADN.Toolkit.Directive.Viewer',
    'Autodesk.ADN.NgGallery.Service.Resource.Model'
  ])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/extension-editor', {
      templateUrl: './js/ui/views/extension-editor/extension-editor.html',
      controller: 'Autodesk.ADN.NgGallery.View.ExtensionEditor.Controller'
    });
  }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.View.ExtensionEditor.Controller',

  ['$scope', '$http', '$sce', 'Model', 'Toolkit', 'AppState', 'Extension',
    function($scope, $http, $sce, Model, Toolkit, AppState, Extension) {

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function getTokenSync() {

        var xhr = new XMLHttpRequest();

        xhr.open("GET", configClient.ApiURL + '/token', false);
        xhr.send(null);

        if(xhr.status != 200) {

          console.log('xrh error: ');
          console.log(xhr.statusText + ':' + xhr.status);
          return '';
        }

        var response = JSON.parse(
          xhr.responseText);

        return response.access_token;
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function getViewablePath(LMVDocument) {

        var viewablePath = [];

        var rootItem = LMVDocument.getRootItem();

        var path3d = Autodesk.Viewing.Document.getSubItemsWithProperties(
          rootItem,
          { 'type': 'geometry', 'role': '3d' },
          true);

        path3d.forEach(function(path){
          viewablePath.push({
            type: '3d',
            name : path.name,
            path: LMVDocument.getViewablePath(path)
          });
        });

        var path2d = Autodesk.Viewing.Document.getSubItemsWithProperties(
          rootItem,
          { 'type': 'geometry', 'role': '2d' },
          true);

        path2d.forEach(function(path){
          viewablePath.push({
            type: '2d',
            name : path.name,
            path: LMVDocument.getViewablePath(path)
          });
        });

        return viewablePath;
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function loadFromId(id) {

        Model.get({ id: id }, function(model) {

          $scope.currentModel = model;

          AppState.pageTitle = 'Gallery - ' + model.name;

          var options = {
            env: configClient.env,
            refreshToken: getTokenSync,
            getAccessToken: getTokenSync
          };

          Autodesk.Viewing.Initializer (options, function () {

            Autodesk.Viewing.Document.load(
              'urn:' + model.urn,
              function (LMVDocument) {

                var viewablePath = getViewablePath(LMVDocument);

                if(viewablePath.length > 0) {

                  var viewer = new Autodesk.Viewing.Private.GuiViewer3D(
                    document.getElementById('viewer-ext-editor'));

                  viewer.initialize();

                  viewer.setLightPreset(8);
                  viewer.setProgressiveRendering(false);

                  viewer.loadModel(viewablePath[0].path);

                  $scope.viewer = viewer;
                }
                else {

                  console.log('Error: No Viewable Path...');
                }
              }, function(error) {

                console.log('Load Error:');
                console.log(error);
              });
          });
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('ui.layout.resize', function (event, data) {

        if($scope.viewer) {
          $scope.viewer.resize();
        }
      });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function initializeEditor() {

        $scope.editor = ace.edit("dynamic-editor");
        $scope.editor.setTheme("ace/theme/chrome");
        $scope.editor.getSession().setMode("ace/mode/javascript");

        $scope.onResetEditor();

        var code = Lockr.get('extension-editor-code');

        if(code) {
          $scope.editor.setValue(code, 1);
        }

        $scope.editor.on('input', function() {

          var code = $scope.editor.getValue();

          Lockr.set('extension-editor-code', code);
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onResetEditor = function() {

        var defaultCodeES2015 = [

          '///////////////////////////////////////////////////////////////////////',
          '// Basic viewer extension ES2015',
          '// ! Requires transpiling to JavaScript 5.1',
          '//',
          '///////////////////////////////////////////////////////////////////////',
          'class BasicES2015 extends Autodesk.Viewing.Extension {',
          '',
          '   // Class constructor',
          '   constructor(viewer, options) {',
          '   ',
          '     super(viewer, options);',
          '   ',
          '     console.log(BasicES2015.ExtensionId + " Constructor");',
          '   ',
          '     this.viewer = viewer;',
          '   ',
          '     this.loadMessage = BasicES2015.ExtensionId + " loaded";',
          '   ',
          '     this.unloadMessage = BasicES2015.ExtensionId + " unloaded";',
          '   }',
          '   ',
          '   // Extension Id',
          '   static get ExtensionId() {',
          '   ',
          '     return "Autodesk.ADN.Viewing.Extension.BasicES2015";',
          '   }',
          '     ',
          '   // Load callback',
          '   load() {',
          '   ',
          '     alert(this.loadMessage);',
          '   ',
          '     this.viewer.setBackgroundColor(255,0,0, 255,255, 255);',
          '   ',
          '     return true;',
          '   }',
          '     ',
          '   // Unload callback',
          '   unload() {',
          '    ',
          '     this.viewer.setBackgroundColor(3,4,5, 250, 250, 250);',
          '    ',
          '     console.log(this.unloadMessage);',
          '    ',
          '     return true;',
          '    }',
          '}',
          '    ',
          'Autodesk.Viewing.theExtensionManager.registerExtension(',
          ' "Autodesk.ADN.Viewing.Extension.BasicES2015",',
          ' BasicES2015);',
          '',
          '',
          '',
          ''
        ];

        var defaultCode = [

          '///////////////////////////////////////////////////////////////////////',
          '// Basic viewer extension',
          '//',
          '///////////////////////////////////////////////////////////////////////',
          'AutodeskNamespace("Autodesk.ADN.Viewing.Extension");',
          '',
          'Autodesk.ADN.Viewing.Extension.Basic = function (viewer, options) {',
          '',
          '   Autodesk.Viewing.Extension.call(this, viewer, options);',
          '',
          '   var _this = this;',
          '',
          '   _this.load = function () {',
          '',
          '       alert("Autodesk.ADN.Viewing.Extension.Basic loaded");',
          '',
          '       viewer.setBackgroundColor(255,0,0, 255,255, 255);',
          '',
          '       return true;',
          '   };',
          '',
          '   _this.unload = function () {',
          '',
          '       viewer.setBackgroundColor(160,176,184, 190,207,216);',
          '',
          '       alert("Autodesk.ADN.Viewing.Extension.Basic unloaded");',
          '',
          '       Autodesk.Viewing.theExtensionManager.unregisterExtension(',
          '           "Autodesk.ADN.Viewing.Extension.Basic");',
          '',
          '       return true;',
          '   };',
          '};',
          '',
          'Autodesk.ADN.Viewing.Extension.Basic.prototype =',
          '   Object.create(Autodesk.Viewing.Extension.prototype);',
          '',
          'Autodesk.ADN.Viewing.Extension.Basic.prototype.constructor =',
          '   Autodesk.ADN.Viewing.Extension.Basic;',
          '',
          'Autodesk.Viewing.theExtensionManager.registerExtension(',
          '   "Autodesk.ADN.Viewing.Extension.Basic",',
          '   Autodesk.ADN.Viewing.Extension.Basic);',
          '',
          '',
          '',
          ''
        ];

        $scope.editor.setValue(defaultCode.join('\n'), 1);
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function extractExtensionIds(str) {

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

          var ext = substr.replaceAll(
            'theExtensionManager.registerExtension', '').
            replaceAll('\n', '').
            replaceAll('(', '').
            replaceAll('\'', '').
            replaceAll('"', '');

          extensions.push(ext.trim());

          start = end;
        }
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onLoadExtension = function() {

        var code = $scope.editor.getValue();

        var extIds = extractExtensionIds(code);

        var payload = {
          code: code,
          options: {}
        };

        Extension.transpile(JSON.stringify(payload), function (response) {

          var res = eval(response.code);

          if(res) {

            loadExtensions(extIds);
          }
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onUnloadExtension = function() {

        $scope.loadedExtIds.forEach(function(extId) {

          $scope.viewer.unloadExtension(extId);
        });

        $scope.loadedExtIds = [];
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function loadExtensions(extIds) {

        if($scope.viewer) {

          extIds.forEach(function(extId) {

            $scope.viewer.loadExtension(extId);

            $scope.loadedExtIds.push(extId);
          });
        }
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('$destroy', function () {

        if($scope.viewer) {

          $scope.viewer.finish();
          $scope.viewer = null;
        }
      });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function initialize() {

        AppState.pageTitle = 'Gallery - Dynamic Editor';

        AppState.activeView = 'extension-editor';

        $scope.loadedExtIds = [];

        $scope.viewer = null;

        $scope.height = 500;

        initializeEditor();

        var id = Autodesk.Viewing.Private.getParameterByName("id");

        if(id.length) {

          loadFromId(id);
        }
        else {

          $scope.$emit('app.EmitMessage', {
            msgId: 'dlg.models',
            msgArgs: {
              source: '/extension-editor'
            }
          });
        }
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      initialize();

    }]);

