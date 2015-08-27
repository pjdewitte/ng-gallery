
'use strict';

angular.module('Autodesk.ADN.NgGallery.Service.Upload', []).

  provider('Upload', {

    $get: function() {

      /////////////////////////////////////////////////////////////////////////
      //
      //
      /////////////////////////////////////////////////////////////////////////
      var _flow = null;

      /////////////////////////////////////////////////////////////////////////
      //
      //
      /////////////////////////////////////////////////////////////////////////
      return {

        initialize: function(
          dropTarget,
          progressTarget,
          progressbarTarget,
          errorTarget,
          chunkSize,
          identifierFunc) {

          _flow = new Flow({

            chunkSize: 1024 * 1024,

            testChunks: false,

            generateUniqueIdentifier:
              (typeof identifierFunc !== 'undefined' ?
                identifierFunc :
                null)
          });

          _flow.assignDrop($(dropTarget));

          // Flow.js isn't supported
          // fall back on a different method
          if (!_flow.support) {
            $(errorTarget).show();
            return null;
          }

          // clears UI
          $(progressTarget).css({
            display: 'none'
          });

          $(progressbarTarget).css({
            width: '0%'
          });

          // Show a place for dropping/selecting files
          $(dropTarget).show();
        },

        progress: function(target) {

          return _flow.progress();
        },

        readablizeBytes: function(bytes) {

          var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];

          var e = Math.floor(Math.log(bytes) / Math.log(1024));

          return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
        },

        secondsToStr: function(temp) {

          function numberEnding(number) {
            return (number > 1) ? 's' : '';
          }

          var years = Math.floor(temp / 31536000);

          if (years) {
            return years + ' year' + numberEnding(years);
          }

          var days = Math.floor((temp %= 31536000) / 86400);

          if (days) {
            return days + ' day' + numberEnding(days);
          }

          var hours = Math.floor((temp %= 86400) / 3600);

          if (hours) {
            return hours + ' hour' + numberEnding(hours);
          }

          var minutes = Math.floor((temp %= 3600) / 60);

          if (minutes) {
            return minutes + ' minute' + numberEnding(minutes);
          }

          var seconds = temp % 60;

          return seconds + ' second' + numberEnding(seconds);
        },

        setTarget: function(target) {

          _flow.opts.target = target;
        },

        setChunkSize: function(chunkSize) {

          _flow.opts.chunkSize = chunkSize;
        },

        setIdentifierFunc: function(identifierFunc) {

          _flow.opts.generateUniqueIdentifier = identifierFunc;
        },

        onUploadStart: function(callback){

          _flow.on('uploadStart', function() {

            callback();
          });
        },

        onUploadComplete: function(callback) {

          _flow.on('complete', function () {

            callback();
          });
        },

        onFileAdded: function(callback){

          _flow.on('fileAdded', function(flowFile) {

            callback (flowFile);
          });
        },

        onFilesSubmitted: function(callback){

          _flow.on('filesSubmitted', function(files) {

            callback (files);
          });
        },

        onFileSuccess: function(callback) {

          _flow.on('fileSuccess', function (file, message) {

            callback(file, message);
          });
        },

        onFileProgress: function(callback) {

          _flow.on('fileProgress', function (file, message) {

            callback(file, message);
          });
        },

        onFileError: function(callback) {

          _flow.on('fileError', function (file, message) {

            callback(file, message);
          });
        },

        uploadAll: function() {

          _flow.upload();
        },

        clear: function() {

          _flow.off();
        }
      }
    }
  });
