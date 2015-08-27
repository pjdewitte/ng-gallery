/**
 * Created by leefsmp on 5/7/15.
 */

var configClient = {

  host: '/node/ng-gallery',
  bucketName: 'ng-gallery-persistent-bucket',
  viewAndDataUrl: 'https://developer.api.autodesk.com',
  ApiURL: "http://" + window.location.host +'/node/ng-gallery/api'
};

var configClientStg = {

  host: '/node/ng-gallery-stg',
  bucketName: 'ng-gallery-persistent-bucket-stg',
  viewAndDataUrl: 'https://developer-stg.api.autodesk.com',
  ApiURL: "http://" + window.location.host +'/node/ng-gallery-stg/api'
};

module.exports = configClient;