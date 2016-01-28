/**
 * Created by leefsmp on 4/6/15.
 */
var path = require('path');

module.exports = {

  entry:{
      gallery: "./www/js/gallery.app.js",
      embed: "./www/js/apps/embed/embed.app.js",
      collaboration: "./www/js/apps/collaboration/collaboration.app.js"
  },

  output: {
    path: path.join(__dirname, '/www/build/'),
    filename: "[name].app.min.js"
  },

  module: {

    loaders: [
      {
        loader: "babel-loader",

        // Only run `.js` and `.jsx` files through Babel
        test: /\.jsx?$/,

        exclude: /(node_modules|bower_components)/,

        //include: [
        //  path.resolve(__dirname, "www/js"),
        //],
        //exclude: [
        //  path.resolve(__dirname, "www/js/lib"),
        //],

        // Options to configure babel with
        query: {
          plugins: ['transform-runtime'],
          presets: ['es2015', 'stage-0']
        }
      },
    ]
  },

  resolve: {
    // enables require('file') instead of require('file.ext')
    extensions: ['', '.js', '.json', '.css']
  },

  plugins: []
};