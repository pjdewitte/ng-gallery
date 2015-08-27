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

var configClient = require("../../../config-client");

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.Dialog.Embed',[])

    ///////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////
    .controller('Autodesk.ADN.NgGallery.Dialog.Embed.Controller',

        ['$scope', function($scope) {

          ///////////////////////////////////////////////////////////////////////////
          //
          //
          ///////////////////////////////////////////////////////////////////////////
          $scope.$on('dlg.embed', function (event, data) {

            var modelId = Autodesk.Viewing.Private.getParameterByName("id");

            $scope.embedCode = "<iframe \n" +
              "width='800' height='480' frameborder='0' \n" +
              "allowFullScreen webkitallowfullscreen mozallowfullscreen \n" +
              "src='http://" + window.location.host + configClient.host + "/embed?id=" + modelId + "'> \n" +
              "</iframe>";

            $('#embedDlg').modal('show');
          });
        }]);