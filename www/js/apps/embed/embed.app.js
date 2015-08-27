
'use strict';

var configClient = require("../../config-client");

require("../../services/model-service");
require("../../services/toolkit-service");
require("../../services/view.and.data-service.js");

require("../../directives/spinning-img-directive");
require("../../directives/viewer-directive");

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.App.Embed',
  [
    'ngResource',

    'Autodesk.ADN.NgGallery.Service.Toolkit',
    'Autodesk.ADN.NgGallery.Service.Resource.Model',
    'Autodesk.ADN.Toolkit.ViewData.Service.ViewAndData',

    'Autodesk.ADN.Toolkit.Directive.Viewer',
    'Autodesk.ADN.Toolkit.UI.Directive.SpinningImg'
  ])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .config(
  [ 'ViewAndDataProvider',
    function (ViewAndDataProvider)
    {
      ViewAndDataProvider.setTokenUrl(
        configClient.ApiURL + '/token');
    }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.App.Embed.Controller',
  ['$scope', 'Model', function($scope, Model) {

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
    // Allows loading special viewer config:
    //http://viewer.autodesk.io/node/ng-gallery/embed?id=54464d43af600b5c0a87254a&
    //viewerConfig=%27{"viewerType":"Viewer3D","lightPreset":"0","progressiveRendering":"false"}%27
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

      if(viewerConfigStr.length > 0) {

        _.assign(
          $scope.viewerConfig,
          JSON.parse(viewerConfigStr));
      }
    }

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
    function loadExtension(extId) {

      var url = configClient.ApiURL +
        '/extensions/' +
        extId;

      $.getJSON(url, function(extension){

        var file = extension.file;

        jQuery.getScript(configClient.ApiURL +
          '/extensions/transpile/' +
          extension.id + '/' +
          extension.file)
          .done(function () {

            $scope.viewer.loadExtension(extId);
          })
          .fail(function(jqxhr, settings, exception) {

            console.log("Load failed: " + extId);
          });
      });
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
    $scope.onViewerInitialized = function (viewer) {

      $scope.viewer = viewer;

      $scope.viewer.resize();

      viewer.addEventListener(
        Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
        $scope.onGeometryLoaded);

      var id = Autodesk.Viewing.Private.getParameterByName("id");

      loadFromId(id);
    };

    ///////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////
    $scope.onGeometryLoaded = function (event) {

      var extIdsParam = Autodesk.Viewing.Private.getParameterByName("extIds");

      if(extIdsParam.length) {

        var extIds = extIdsParam.split(';');

        extIds.forEach(function(extId) {

          loadExtension(extId);
        });
      }
    }

    ///////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////
    $scope.onDestroy = function (viewer) {

      viewer.finish();
    };

    ///////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////
    loadViewerConfig();

  }]);



