//////////////////////////////////////////////////////////////////////////////
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

var configClient = require("../../../config-client");

require("../../../services/model-service");
require("../../../services/toolkit-service");
require("../../../directives/viewer-directive");
require("../../../extensions/Autodesk.ADN.Viewing.Extension.VR");

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.View.Viewer-VR',
  [
    'Autodesk.ADN.NgGallery.Service.Resource.Model',
    'Autodesk.ADN.NgGallery.Service.Toolkit',
  ])

  ///////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////
  .config(['$routeProvider',

    function($routeProvider) {

      $routeProvider.when('/viewer-vr', {
        templateUrl: './js/ui/views/viewer-vr/viewer-vr.html',
        controller: 'Autodesk.ADN.NgGallery.View.Viewer-VR.Controller'
      });
    }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.View.Viewer-VR.Controller',

  ['$rootScope', '$scope', '$timeout', 'Model', 'Toolkit', 'AppState',
    function($rootScope, $scope, $timeout, Model, Toolkit, AppState) {

      ///////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////
      function getTokenSync() {

        var xhr = new XMLHttpRequest();

        xhr.open("GET", configClient.ApiURL + '/token', false);
        xhr.send(null);

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
                    document.getElementById('viewer-vr'));

                  viewer.initialize();

                  viewer.setLightPreset(8);
                  viewer.setProgressiveRendering(false);

                  viewer.addEventListener(
                    Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                    onGeometryLoaded);

                  viewer.load(viewablePath[0].path);
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
      function onGeometryLoaded(event) {

        var viewer = event.target;

        viewer.removeEventListener(
          Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
          onGeometryLoaded);

        viewer.loadExtension('Autodesk.ADN.Viewing.Extension.VR', {
          requestUserGesture: true
        });
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      ///////////////////////////////////////////////////////////////////////
      function initialize() {

        AppState.activeView = 'viewer';

        AppState.showNavbar = false;

        var id = Autodesk.Viewing.Private.getParameterByName("id");

        if (id.length) {

          loadFromId(id);
        }
      }

      ///////////////////////////////////////////////////////////////////////
      //
      //
      //////////////////////////////////////////////////////////////////////
      initialize();

    }]);