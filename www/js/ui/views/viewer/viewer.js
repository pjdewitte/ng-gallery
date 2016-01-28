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
require("../../../extensions/Autodesk.ADN.Viewing.Extension.Collaboration");
require("../../../extensions/Autodesk.ADN.Viewing.Extension.StateManager");
require("../../../extensions/Autodesk.ADN.Viewing.Extension.EmbedManager");
require("../../navbars/viewer-navbar/viewer-navbar");
require("../../../directives/viewer-directive");

var configClient = require("../../../config-client");

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.View.Viewer',
  [
    'Autodesk.ADN.NgGallery.Service.Resource.Model',
    'Autodesk.ADN.NgGallery.Navbar.ViewerNavbar',
    'Autodesk.ADN.NgGallery.Service.Toolkit',
    'Autodesk.ADN.Toolkit.Directive.Viewer'
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

  ['$rootScope', '$scope', '$timeout', 'Model', 'Toolkit', 'AppState', 'Channel',
    function($rootScope, $scope, $timeout, Model, Toolkit, AppState, Channel) {

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
      function addView(path) {

        var view = {
          id: Toolkit.guid(),
          viewer: null,
          path: path
        };

        $scope.views.push(view);

        resize();
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function removeView(id) {

        $scope.views.forEach(function(view, idx){

          if(id === view.id) {

            if(view.viewer) {

              view.viewer.finish();

              view.viewer = null;
            }

            $scope.views.splice(idx, 1);
          }
        });

        resize();
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function getViewById(id) {

        var result = _.filter($scope.views, function(view){

          return (view.id === id);
        });

        return (result.length ? result[0] : {});
      }

      function getViewByPath(path) {

        var result = _.filter($scope.views, function(view){

          return (view.path === path);
        });

        return (result.length ? result[0] : {});
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function getViewConfig(mode, nbViews, viewIdx) {

        var viewConfig = {

          width: '100vw',
          height: '100vh',
          splitter: {
            width: '0px',
            height: '0px'
          }
        };

        var navbarHeight =
          (AppState.showNavbar ? 64 : 0) +
          $scope.viewerNavbarHeight;

        var splitterSize = 2;

        switch(mode) {

          case 'VIEWER_LAYOUT_MODE_ROW_FITTED':

            viewConfig.height =
              `calc(${100/nbViews}vh - ${navbarHeight/nbViews}px)`;

            viewConfig.width = '100vw';

            viewConfig.splitter.height =
              splitterSize + 'px';

            viewConfig.splitter.width =
              '100vw';

            break;

          case 'VIEWER_LAYOUT_MODE_ROW':

            viewConfig.height =
              `calc(100vh - ${navbarHeight}px)`;

            viewConfig.width =
              `calc(100vw - 15px)`;

            viewConfig.splitter.height =
              splitterSize + 'px';

            viewConfig.splitter.width =
              '100vw';

            break;

          case 'VIEWER_LAYOUT_MODE_COLUMN_FITTED':

            viewConfig.height =
              `calc(100vh - ${navbarHeight}px)`;

            viewConfig.width =
              `calc(${100/nbViews}vw + ${(1/nbViews - 1) * splitterSize}px)`;

            viewConfig.splitter.height =
              `calc(100vh - ${navbarHeight}px)`;

            viewConfig.splitter.width =
              splitterSize + 'px';

            break;

          case 'VIEWER_LAYOUT_MODE_COLUMN_2:1':

            viewConfig.height =
              `calc(100vh - ${navbarHeight}px)`;

            //First view is twice the size than other views
            viewConfig.width =
              `calc(${(viewIdx ? 1 : 2) * 100/(nbViews+1)}vw + ${(1/nbViews - 1) * splitterSize}px)`;

            viewConfig.splitter.height =
              `calc(100vh - ${navbarHeight}px)`;

            viewConfig.splitter.width =
              splitterSize + 'px';

            break;
        }

        return viewConfig;
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function resize() {

        $scope.views.forEach(function(view, viewIdx) {

          var viewConfig = getViewConfig(
            $scope.viewerLayoutMode,
            $scope.views.length,
            viewIdx);

          _.assign(view, viewConfig);

          setTimeout(function(){
            if(view.viewer) {
              view.viewer.resize();
            }
          }, 250);
        });
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
      function loadFromUrn(urn) {

        var options = {
          env: configClient.env,
          refreshToken: getTokenSync,
          getAccessToken: getTokenSync
        };

        Autodesk.Viewing.Initializer (options, function () {

          Autodesk.Viewing.Document.load(
            'urn:' + urn,
            function (LMVDocument) {

              var viewablePath = getViewablePath(LMVDocument);

              $scope.$broadcast('viewer.viewable-path-loaded', {
                viewablePath: viewablePath
              });

              if(viewablePath.length > 0) {

                addView(viewablePath[0].path);
              }
              else {

                console.log('Error: No Viewable Path...');
              }
            }, function(error) {

              console.log('Load Error:');
              console.log(error);
            });
        });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function loadFromId(id) {

        Model.get({ id: id }, function(model) {

          $scope.currentModel = model;

          AppState.pageTitle = 'Gallery - ' + model.name;

          loadFromUrn(model.urn);
        });
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      //////////////////////////////////////////////////////////////////////
      function showViewerNavbar(visible) {

        $scope.viewerNavbarVisible = visible;

        $scope.viewerNavbarHeight = visible ? 50 : 0;

        $scope.$broadcast('viewer.load-navbar', {
          visible: visible
        });

        $timeout(function(){
          resize();
        }, 50);
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function showAppNavbar(visible) {

        AppState.showNavbar = visible;

        $('#views-container').css({
          'height': (visible ? 'calc(100vh - 64px)' : '100vh')
        });
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
      function loadCollaboration(viewer, path, container) {

        viewer.loadExtension(
          'Autodesk.ADN.Viewing.Extension.Collaboration', {
            host: configClient.host,
            port: configClient.collaboration.port,
            controlGroup: 'Gallery',
            container: container,
            meetingId: '',
            viewablePath: path
          });
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function onGeometryLoaded(event) {

        var viewer = event.target;

        viewer.removeEventListener(
          Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
          onGeometryLoaded);

        viewer.setProgressiveRendering(false);

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
            controlGroup: 'Gallery',
            apiUrl: configClient.ApiURL + '/extensions',
            extensionsChannel: Channel.getChannel('extensions.connect'),
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
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('viewer-navbar.activate-path',

        function (event, data) {

          addView(data.path);
        });

      $scope.$on('viewer-navbar.deactivate-path',

        function (event, data) {

          var view = getViewByPath(data.path);

          removeView(view.id);
        });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('viewer-navbar.layout-mode-changed',

        function (event, data) {

          $scope.viewerLayoutMode = data.mode;

          resize();
        });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('viewer-navbar.search-input-modified',

        function (event, data) {
          
          $scope.views.forEach(function (view) {

            view.viewer.isolate([]);

            view.viewer.search(data.searchInput, function (ids) {

              view.viewer.isolate(ids);
            });
          });
        });

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      $scope.onViewerDivCreated = function(id) {

        var view = getViewById(id);

        var container = document.getElementById(id);

        var viewer = new Autodesk.Viewing.Private.GuiViewer3D(
          container);

        viewer.initialize();

        viewer.setLightPreset(8);
        viewer.setProgressiveRendering(false);

        viewer.addEventListener(
          Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
          onGeometryLoaded);

        viewer.load(view.path);

        view.viewer = viewer;

        loadCollaboration(viewer, view.path, viewer.container);
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      $scope.onViewerDivDestroyed = function(id) {

        removeView(id);
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('$destroy', function () {

        $scope.views.forEach(function(view){

          view.viewer.finish();

          view.viewer = null;
        });
      });

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function initialize() {

        $scope.viewerLayoutMode = 'VIEWER_LAYOUT_MODE_COLUMN_2:1';

        showAppNavbar(!AppState.mobile);

        AppState.activeView = 'viewer';

        showViewerNavbar(false);

        $scope.views = [];

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
      }

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('viewer.load-urn', function (event, data) {

        loadFromUrn(data.urn);
      });

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      $scope.$on('viewer.load-file', function (event, data) {

        var filename = URL.createObjectURL(data.file);

        var options = {
          env: 'Local'
        };

        Autodesk.Viewing.Initializer (options, function () {

          addView('file:///Users/leefsmp/Documents/Temp/models/SVF/OblivionCopter/oblivion-copter.svf');
          //addView(filename);
        });
      });

      ///////////////////////////////////////////////////////////////////////
      //
      //
      //////////////////////////////////////////////////////////////////////
      initialize();

    }]);