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
require("../../services/model-service");
require("../../services/toolkit-service");
require("../../services/appState-service");
require("../../ui/navbars/app-navbar/app-navbar");
require("../../directives/spinning-img-directive");
require("../../extensions/Autodesk.ADN.Viewing.Extension.VR");
require("../../extensions/Autodesk.ADN.Viewing.Extension.StateManager");
require("../../extensions/Autodesk.ADN.Viewing.Extension.Collaboration");
require("../../../uploads/extensions/Autodesk.ADN.Viewing.Extension.ControlSelector/Autodesk.ADN.Viewing.Extension.ControlSelector.js");

var configClient = require("../../config-client");

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.App.Collaboration', [
    'ngResource',
    'Autodesk.ADN.NgGallery.Service.Toolkit',
    'Autodesk.ADN.NgGallery.Service.AppState',
    'Autodesk.ADN.NgGallery.Navbar.AppNavbar',
    'Autodesk.ADN.Toolkit.UI.Directive.SpinningImg'
  ])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.App.Collaboration.Controller',
  ['$scope', 'Toolkit', 'AppState', function($scope, Toolkit, AppState) {

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
    function loadCollaboration(viewer, container) {

      var meetingId = Autodesk.Viewing.Private.getParameterByName("meetingId");

      if(meetingId.length) {

        viewer.loadExtension(
          'Autodesk.ADN.Viewing.Extension.Collaboration', {
            host: configClient.host,
            port: configClient.collaboration.port,
            controlGroup: 'Autodesk.ADN.MetaEditor.ControlGroup',
            meetingId: meetingId,
            mobile: AppState.mobile,
            container: container,
            onLoadDocument: function(urn, modelId) {

              loadExtensions(viewer, modelId);
            }
          });
      }
    }

    ///////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////
    function loadExtensions(viewer, modelId) {

      viewer.loadExtension('Autodesk.Measure');

      viewer.loadExtension('Autodesk.Section');

      viewer.loadExtension(
        'Autodesk.ADN.Viewing.Extension.StateManager', {
          controlGroup: 'Autodesk.ADN.MetaEditor.ControlGroup',
          apiUrl: configClient.ApiURL + '/states/' + modelId
        });

      viewer.loadExtension(
        'Autodesk.ADN.Viewing.Extension.ControlSelector', {
          isMobile: AppState.mobile
        });
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

      AppState.mobile = Toolkit.mobile().isAny();

      AppState.showNavbar = !AppState.mobile;

      if(!AppState.showNavbar) {

        $('#viewer-collaboration').css({
          'height':'100vh'
        });
      }

      $scope.viewer = null;

      var options = {
        env: configClient.env,
        refreshToken: getTokenSync,
        getAccessToken: getTokenSync
      };

      Autodesk.Viewing.Initializer(options, function () {

        var container = document.getElementById('viewer-collaboration');

        var viewer = new Autodesk.Viewing.Private.GuiViewer3D(
          container);

        viewer.initialize();

        viewer.setLightPreset(8);
        viewer.setProgressiveRendering(false);

        $scope.viewer = viewer;

        loadCollaboration(viewer, viewer.container);
      });
    }

    ///////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////
    initialize();

  }]);
