/**
 * Created by leefsmp on 2/27/15.
 */

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

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
angular.module('Autodesk.ADN.NgGallery.Navbar.ViewerNavbar', [])

    ///////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////
    .controller('Autodesk.ADN.NgGallery.Navbar.ViewerNavbar.Controller',

        ['$scope', '$sce', function($scope, $sce) {

            ///////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////
            $scope.$watch('searchInput', function() {

                $scope.$emit(
                  'viewer-navbar.search-input-modified', {
                      searchInput: $scope.searchInput
                  });
            });

            ///////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////
            $scope.$on('viewer.viewable-path-loaded', function (event, data) {

                data.viewablePath.forEach(function(path) {

                    $scope.viewablePath.push({
                        selected: ($scope.viewablePath.length == 0),
                        name: $sce.trustAsHtml(path.name),
                        path: path.path,
                        type: path.type
                    });
                });
            });

            ///////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////
            $scope.$on('viewer.load-navbar', function (event, data) {

                var $multiselectPath = $(".multiselect-path").multiselect({

                    selectedList: 1,
                    noneSelectedText: "Select Active Views",
                    header: "Select Active Views",

                    click: function(event, ui){

                        if(ui.checked) {
                            $scope.$emit(
                              'viewer-navbar.activate-path', {
                                  path: ui.value
                              });
                        }
                        else {
                            $scope.$emit(
                              'viewer-navbar.deactivate-path', {
                                  path: ui.value
                              });
                        }
                    }
                }).multiselectfilter();

                var $multiselectLayout = $(".multiselect-layout").multiselect({

                    multiple:false,
                    selectedList: 1,
                    header: "Select Layout Mode",

                    click: function(event, ui){

                        $scope.$emit(
                          'viewer-navbar.layout-mode-changed', {
                              mode: ui.value
                          });
                    }
                });

                $multiselectLayout.multiselect(
                  $scope.viewablePath.length > 1 ? 'enable':'disable');
            });

            ///////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////
            $scope.viewablePath = [];

            $scope.searchInput = "";
    }]);





