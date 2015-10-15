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

require("../../../extensions/Autodesk.ADN.Viewing.Extension.ExtensionManager");
require("../../../extensions/Autodesk.ADN.Viewing.Extension.AnimationManager");
require("../../../extensions/Autodesk.ADN.Viewing.Extension.ControlSelector");
require("../../../extensions/Autodesk.ADN.Viewing.Extension.StateManager");
require("../../../extensions/Autodesk.ADN.Viewing.Extension.EmbedManager");
require("../../../extensions/Autodesk.ADN.Viewing.Extension.Collaboration");
require("../../navbars/viewer-navbar/viewer-navbar");
require("../../../directives/viewer-directive");
require("../../controls/treeview/treeview");

var configClient = require("../../../config-client");

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.View.Viewer',
  [
    'ngRoute',
    'treeControl',
    'Autodesk.ADN.NgGallery.Control.Treeview',
    'Autodesk.ADN.Toolkit.Directive.Viewer',
    'Autodesk.ADN.NgGallery.Navbar.ViewerNavbar',
    'Autodesk.ADN.NgGallery.Service.Toolkit',
    'Autodesk.ADN.NgGallery.Service.Resource.Model'
  ])

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  .config(['$routeProvider',

    function($routeProvider) {

      $routeProvider.when('/viewer', {
        templateUrl: './js/ui/views/viewer/viewer.html',
        controller: 'Autodesk.ADN.NgGallery.View.Viewer.Controller'
      });
    }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.View.Viewer.Controller',

  ['$rootScope', '$scope', '$timeout', 'Model', 'Toolkit', 'AppState',
    function($rootScope, $scope, $timeout, Model, Toolkit, AppState) {

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function loadViewerConfig() {

        String.prototype.replaceAll = function (find, replace) {
          var str = this;
          return str.replace(new RegExp(
              find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'),
            replace);
        };

        var viewerConfigStr = Autodesk.Viewing.Private.getParameterByName("viewerConfig");

        viewerConfigStr = viewerConfigStr.replaceAll("'", "");

        if(viewerConfigStr.length > 0)
          $scope.viewerConfig = JSON.parse(viewerConfigStr);
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function loadFromId(id) {

        if(id.length) {

          Model.get({ id: id }, function(model) {

            $scope.docUrn = model.urn;
            $scope.currentModel = model;
            AppState.pageTitle = 'Gallery - ' + model.name;

          });
        }
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      //////////////////////////////////////////////////////////////////////
      function showViewerNavbar(visible) {

        $scope.viewerNavbarVisible = visible;

        $scope.viewerNavbarHeight = visible ? 50 : 0;

        $timeout(function(){
          resize($scope.viewerLayoutMode);
        }, 500);
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function showAppNavbar(visible) {

        AppState.showNavbar = visible;

        $scope.viewerStyle = (visible ? "top:64px" : "top:0px");
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function resize(mode) {

        var height = $('#viewer-container').height() - $scope.viewerNavbarHeight;

        var width = $('#viewer-container').width();

        var nb = $scope.selectedPath.length;

        switch(mode) {

          case 'VIEWER_LAYOUT_MODE_ROW_FITTED':

            $scope.viewerConfig.height = height / nb + 'px';

            $scope.viewerConfig.width = width + 'px';

            $scope.viewerConfig.splitterHeight =
              $scope.viewerConfig.splitterSize + 'px';

            $scope.viewerConfig.splitterWidth = width + 'px';

            break;

          case 'VIEWER_LAYOUT_MODE_ROW':

            $scope.viewerConfig.height = height + 'px';

            $scope.viewerConfig.width = width - 15 + 'px';

            $scope.viewerConfig.splitterHeight =
              $scope.viewerConfig.splitterSize + 'px';

            $scope.viewerConfig.splitterWidth = width + 'px';

            break;

          case 'VIEWER_LAYOUT_MODE_COLUMN_FITTED':

            $scope.viewerConfig.height = height + 'px';

            $scope.viewerConfig.width = width / nb +
            (1/nb - 1) * $scope.viewerConfig.splitterSize + 'px';

            $scope.viewerConfig.splitterHeight = height + 'px';

            $scope.viewerConfig.splitterWidth =
              $scope.viewerConfig.splitterSize + 'px';

            break;
        }

        for(var id in $scope.viewers) {

          $scope.viewers[id].resize();
        }
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function onViewerNavbarBtnClicked() {

        $scope.viewerNavbarVisible = !$scope.viewerNavbarVisible;

        showViewerNavbar($scope.viewerNavbarVisible);
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function connectExtension(extension) {

        if(!$scope.extensionsMap[extension.connectId]) {

          $scope.extensionsMap[extension.connectId] = {};
        }

        var extensionsMap = $scope.extensionsMap[extension.connectId];

        for(var extGuid in extensionsMap) {

          extensionsMap[extGuid].onConnect(extension);

          extension.onConnect(extensionsMap[extGuid]);
        }

        $scope.extensionsMap[extension.connectId][extension.guid] = extension;
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function disconnectExtension(extension) {

        for(var extGuid in $scope.extensionsMap[extension.connectId]) {

          if(extGuid !== extension.guid) {

            $scope.extensionsMap[extension.connectId][extGuid].onDisconnect(extension);
          }
        }

        delete $scope.extensionsMap[extension.connectId][extension.guid];
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onGeometryLoaded = function (event) {

        var viewer = event.target;

        viewer.removeEventListener(
          Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
          $scope.onGeometryLoaded);

        viewer.setProgressiveRendering(false);

        resize($scope.viewerLayoutMode);

        var ctrlGroup = Toolkit.getControlGroup(viewer,
          'Gallery');

        var viewerNavbarBtn = Toolkit.createButton(
          'Gallery.Viewer.Button.Navbar',
          'glyphicon glyphicon-briefcase',
          'Viewer Toolbar',
          onViewerNavbarBtnClicked);

        ctrlGroup.addControl(viewerNavbarBtn, {index: 0});

        viewer.loadExtension(
          'Autodesk.ADN.Viewing.Extension.AnimationManager', {
            controlGroup: 'Gallery',
            index: 1
          });

        viewer.loadExtension(
          'Autodesk.ADN.Viewing.Extension.ExtensionManager', {
            index: 2,
            connect: connectExtension,
            disconnect: disconnectExtension,
            controlGroup: 'Gallery',
            apiUrl: configClient.ApiURL + '/extensions',
            extensionsUrl: configClient.ApiURL + '/extensions/transpile',
            extensionsSourceUrl: configClient.host + '/uploads/extensions'
          });

        viewer.loadExtension(
          'Autodesk.ADN.Viewing.Extension.StateManager', {
            index: 3,
            controlGroup: 'Gallery',
            apiUrl: configClient.ApiURL +
            '/states/' +
            $scope.currentModel._id
          });

        viewer.loadExtension(
          'Autodesk.ADN.Viewing.Extension.EmbedManager', {
            controlGroup: 'Gallery',
            onEmbedClicked: function() {
              $scope.$emit('app.EmitMessage', {
                msgId: 'dlg.embed',
                msgArgs: {}
              });
            }
          });

        $scope.$broadcast('viewer.geometry-loaded', {
          viewer: event.target
        });

        viewer.unloadExtension("Autodesk.Section");

        viewer.loadExtension(
          'Autodesk.ADN.Viewing.Extension.ControlSelector', {
            isMobile: Toolkit.mobile().isAny()
          });
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onViewablePath = function(pathInfoCollection) {

        $scope.$broadcast('viewer.viewable-path-loaded', {
          pathInfoCollection: pathInfoCollection
        });

        $scope.pathInfoCollection = pathInfoCollection;

        if($scope.pathInfoCollection.path3d.length > 0) {

          $scope.selectedPath.push(
            $scope.pathInfoCollection.path3d[0].path);
        }

        else if($scope.pathInfoCollection.path2d.length > 0) {

          $scope.selectedPath.push(
            $scope.pathInfoCollection.path2d[0].path);
        }
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onViewerInitialized = function (viewer) {

        $scope.viewers[viewer.id] = viewer;

        $timeout(function(){
          resize($scope.viewerLayoutMode);
        }, 500);

        viewer.addEventListener(
          Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
          $scope.onGeometryLoaded);

        $('.loader-background').remove();
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onPathLoaded = function (viewer, path) {

        viewer.loadExtension(
          'Autodesk.ADN.Viewing.Extension.Collaboration', {
            host: configClient.host,
            port: configClient.collaboration.port,
            controlGroup: 'Gallery',
            meetingId: '',
            viewablePath: path
          });
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onViewerFactoryInitialized = function (factory) {

        var id = Autodesk.Viewing.Private.getParameterByName("id");

        if (id.length) {

          loadFromId(id);
        }
        else {

          $scope.$emit('app.EmitMessage', {
            msgId: 'dlg.models',
            msgArgs: {
              source: '/viewer'
            }
          });
        }
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.onDestroy = function (viewer) {

        delete $scope.viewers[viewer.id];

        viewer.finish();
      };

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('ui.layout.resize', function (event, data) {

        resize($scope.viewerLayoutMode);
      });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('viewer.viewable-path-selected',

        function (event, data) {

          $scope.selectedPath = data.selectedItems;
        });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('viewer.layout-mode-changed',

        function (event, data) {

          $scope.viewerLayoutMode = data.selectedLayoutMode;

          resize($scope.viewerLayoutMode);
        });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('viewer.search-input-modified',

        function (event, data) {

          for(var id in $scope.viewers) {

            var viewer = $scope.viewers[id];

            viewer.isolate([]);

            viewer.search(data.searchInput, function(ids){

              viewer.isolate(ids);
            });
          }
        });

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function initialize() {

        $scope.tokenUrl = configClient.ApiURL + '/token';

        $(window).resize(function() {
          $timeout(function(){
            resize($scope.viewerLayoutMode);
          }, 500);
        });

        $scope.viewerLayoutMode = 'VIEWER_LAYOUT_MODE_ROW_FITTED';

        AppState.activeView = 'viewer';

        $scope.extensionsMap = {};

        $scope.selectedPath = [];

        $scope.viewers = {};

        $scope.viewerContainerConfig = {

          environment: 'AutodeskProduction'
          //environment: 'AutodeskStaging'
        };

        $scope.viewerConfig = {

          lightPreset: 8,
          viewerType: 'GuiViewer3D',
          qualityLevel: [false, true],
          progressiveRendering: false,

          width: '100%',
          height: '100px',
          splitterSize: 2,
          splitterWidth: '2px',
          splitterHeight: '2px'
        };

        loadViewerConfig();

        showViewerNavbar(false);

        showAppNavbar(!Toolkit.mobile().isAny());
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      //////////////////////////////////////////////////////////////////////
      initialize();

    }]);