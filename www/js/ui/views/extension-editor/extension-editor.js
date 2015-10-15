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

      $scope.tokenUrl = configClient.ApiURL + '/token';

      $scope.viewerContainerConfig = {

        environment: 'AutodeskProduction'
      };

      $scope.viewerConfig = {

        lightPreset: 8,
        viewerType: 'GuiViewer3D',
        qualityLevel: [true, true],
        navigationTool:'freeorbit',
        progressiveRendering: true,
        backgroundColor:[3,4,5, 250, 250, 250]
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function loadFromId(id) {

        if(id.length) {

          Model.get({ id: id }, function(model) {
            $scope.docUrn = model.urn;
          });
        }
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onViewerFactoryInitialized = function (factory) {

      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onViewerInitialized = function (viewer) {

        $scope.viewer = viewer;

        $scope.viewer.resize();

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
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onViewablePath = function (pathInfoCollection) {

        if(pathInfoCollection.path3d.length > 0) {

          $scope.path = pathInfoCollection.path3d[0].path;

          $scope.viewer.load($scope.path);
        }

        else if(pathInfoCollection.path2d.length > 0) {

          $scope.path = pathInfoCollection.path2d[0].path;

          $scope.viewer.load($scope.path);
        }
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onDestroy = function (viewer) {

        if(viewer)
          viewer.finish();
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('ui.layout.resize', function (event, data) {

        resize();
      });

      function resize() {

        $('#viewer-extension-editor').height(
          $('#viewer-extension-editor-container').height());

        if($scope.viewer) {
          $scope.viewer.resize();
        }
      }

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
      };

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
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onUnloadExtension = function() {

        $scope.loadedExtIds.forEach(function(extId) {

          $scope.viewer.unloadExtension(extId);
        });

        $scope.loadedExtIds = [];
      };

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
      AppState.pageTitle = 'View & Data Gallery';

      AppState.activeView = 'extension-editor';

      $scope.loadedExtIds = [];

      $scope.viewer = null;

      $scope.height = 500;

      initializeEditor();
    }]);

