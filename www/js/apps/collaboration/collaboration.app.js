
var configClient = require("../../config-client");

require("../../services/model-service");
require("../../services/toolkit-service");
require("../../services/thumbnail-service");
require("../../services/view.and.data-service");

require("../../directives/spinning-img-directive");
require("../../directives/viewer-directive");

require("../../extensions/Autodesk.ADN.Viewing.Extension.Collaboration");
require("../../extensions/Autodesk.ADN.Viewing.Extension.StateManager");

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.App.Collaboration', [

    'ngResource',

    'Autodesk.ADN.NgGallery.Service.Toolkit',
    'Autodesk.ADN.NgGallery.Service.Resource.Model',
    'Autodesk.ADN.NgGallery.Service.Resource.Thumbnail',
    'Autodesk.ADN.Toolkit.ViewData.Service.ViewAndData',

    'Autodesk.ADN.Toolkit.Directive.Viewer',
    'Autodesk.ADN.Toolkit.UI.Directive.SpinningImg'
  ])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .config(['ViewAndDataProvider',
    function (ViewAndDataProvider)
    {
      ViewAndDataProvider.setTokenUrl(
        configClient.ApiURL + '/token');
    }])

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  .controller('Autodesk.ADN.NgGallery.App.Collaboration.Controller',
  ['$scope', function($scope) {

    $scope.tokenUrl = configClient.ApiURL + '/token';

    $scope.viewerContainerConfig = {

      environment: 'AutodeskProduction'
    };

    $scope.viewerConfig = {

      lightPreset: 8,
      viewerType: 'GuiViewer3D',
      qualityLevel: [false, true],
      progressiveRendering: false,
      backgroundColor:[3,4,5, 250, 250, 250]
    };
    
    ///////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////
    function loadExtensions(viewer, modelId) {
      
      viewer.loadExtension('Autodesk.Measure');

      viewer.loadExtension('Autodesk.ADN.Viewing.Extension.StateManager', {
        controlGroup: 'Autodesk.ADN.MetaEditor.ControlGroup',
        apiUrl: configClient.ApiURL + '/states/' + modelId
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

    };

    ///////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////
    $scope.onViewerInitialized = function (viewer) {

      $scope.viewer = viewer;

      $scope.viewer.resize();

      var meetingId = Autodesk.Viewing.Private.getParameterByName("meetingId");

      if(meetingId.length) {

        $scope.viewer.loadExtension('Autodesk.ADN.Viewing.Extension.Collaboration', {
          host: configClient.host,
          port: 5002,
          controlGroup: 'Autodesk.ADN.MetaEditor.ControlGroup',
          meetingId: meetingId,
          onLoadDocument: function(urn, modelId) {

            loadExtensions(viewer, modelId);
          }
        });
      }
    };

    ///////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////
    $scope.onDestroy = function (viewer) {

      viewer.finish();
    };

  }]);
