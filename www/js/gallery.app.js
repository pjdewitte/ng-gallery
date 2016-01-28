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

//config
var configClient = require("./config-client");

// Dialogs
require("./ui/dialogs/item/item");
require("./ui/dialogs/embed/embed");
require("./ui/dialogs/login/login");
require("./ui/dialogs/models/models");

//Views
require("./ui/views/home/home");
require("./ui/views/upload/upload");
require("./ui/views/viewer/viewer");
require("./ui/views/viewer-vr/viewer-vr");
require("./ui/views/extensions/extensions");
require("./ui/navbars/app-navbar/app-navbar");
require("./ui/views/viewer-local/viewer-local");
require("./ui/views/extension-editor/extension-editor");

// Directives
require("./directives/spinning-img-directive");

// Services
require("./services/view.and.data-service");
require("./services/extension-service");
require("./services/thumbnail-service");
require("./services/appState-service");
require("./services/toolkit-service");
require("./services/channel-service");
require("./services/upload-service");
require("./services/model-service");

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('ui-layout-events', [
  'ui.layout'
])
  .directive('uiLayout', function($timeout, $rootScope) {

    var methods = ['updateDisplay',
        'toggleBefore',
        'toggleAfter',
        'mouseUpHandler',
        'mouseMoveHandler'],
      timer;

    function fireEvent() {
      if(timer) $timeout.cancel(timer);
      timer = $timeout(function() {
        $rootScope.$broadcast('ui.layout.resize');
        timer = null;
      }, 0);
    }

    return {
      restrict: 'AE',
      require: '^uiLayout',
      link: function(scope, elem, attrs, uiLayoutCtrl) {
        angular.forEach(methods, function(method) {
          var oldFn = uiLayoutCtrl[method];
          uiLayoutCtrl[method] = function() {
            oldFn.apply(uiLayoutCtrl, arguments);
            fireEvent();
          };
        });
      }
    };
  });

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.App',
  [
    // Angular
    'ngRoute',

    // Libs
    'flow',
    'ui.layout',
    'ui-layout-events',
    'ngMdIcons',
    'ngResource',

    // Views
    'Autodesk.ADN.NgGallery.View.Home',
    'Autodesk.ADN.NgGallery.View.Viewer',
    'Autodesk.ADN.NgGallery.View.Upload',
    'Autodesk.ADN.NgGallery.View.Viewer-VR',
    'Autodesk.ADN.NgGallery.View.Extensions',
    'Autodesk.ADN.NgGallery.View.Viewer-Local',
    'Autodesk.ADN.NgGallery.View.ExtensionEditor',

    // Navbar
    'Autodesk.ADN.NgGallery.Navbar.AppNavbar',

    // Dialogs
    'Autodesk.ADN.NgGallery.Dialog.Item',
    'Autodesk.ADN.NgGallery.Dialog.About',
    'Autodesk.ADN.NgGallery.Dialog.Embed',
    'Autodesk.ADN.NgGallery.Dialog.Login',
    'Autodesk.ADN.NgGallery.Dialog.Models',

    // Directives
    'Autodesk.ADN.Toolkit.UI.Directive.SpinningImg',

    //Services
    'Autodesk.ADN.NgGallery.Service.Upload',
    'Autodesk.ADN.NgGallery.Service.Channel',
    'Autodesk.ADN.NgGallery.Service.Toolkit',
    'Autodesk.ADN.NgGallery.Service.AppState',
    'Autodesk.ADN.NgGallery.Service.Resource.Model',
    'Autodesk.ADN.NgGallery.Service.Resource.Thumbnail',
    'Autodesk.ADN.Toolkit.ViewData.Service.ViewAndData',
    'Autodesk.ADN.NgGallery.Service.Resource.Extension'
  ])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .config(
  ['$routeProvider',
    '$locationProvider',
    '$httpProvider',
    'ViewAndDataProvider',
    function ($routeProvider,
              $locationProvider,
              $httpProvider,
              ViewAndDataProvider)
    {
      $routeProvider.otherwise({redirectTo: '/home'});

      //$locationProvider.html5Mode(true);

      ViewAndDataProvider.setTokenUrl(
        configClient.ApiURL + '/token');
    }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.App.Controller',
  ['$scope', '$http', 'AppState', 'Toolkit', 'Channel',
    function($scope, $http, AppState, Toolkit, Channel) {

      $scope.AppState = AppState;

      AppState.mobile = Toolkit.mobile().isAny();

      requirejs.config({
        waitSeconds: 0
      });

      Channel.addChannel('extensions.connect');

      $http.get(configClient.ApiURL + '/auth/isAuthenticated').

      success(function (user){

        AppState.isAuthenticated = user ? true : false;
      }).

      error(function(){

        AppState.isAuthenticated = false;
      });

      $scope.$on('app.EmitMessage', function (event, data) {

        $scope.$broadcast(data.msgId, data.msgArgs);
      });

    }]);


