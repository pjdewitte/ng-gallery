#Autodesk View & Data API - Angular Sample


##Description


A comprehensive sample using Autodesk View & Data API powered by Node.js/MongoDb backend with an AngularJs frontend

##Setup/Usage Instructions


* Install Node.js
* Run `npm install` command from the project directory to resolve Node dependencies, you need to run as administrator `sudo npm install` if you are using Mac or Linux. 
    
* Replace the place holder with your own credentials in credentials.js

* The backend expects running MongoDB database to connect to, so you will need to Install and run MongoDB, see [their tutorial] (http://docs.mongodb.org/manual/tutorial/) for instructions.

* Alternatively, you can also use a cloud-based database such as Mongolab which offers free tiers

* You need to create 3 collections in your database: 'gallery.models', 'gallery.extensions', 'gallery.thumbnails'

* You need to populate the 'gallery.models' with uploaded models translated with View & Data API (see section "Uploading your models for View & Data API" below), check the response from that [REST API](http://viewer.autodesk.io/node/gallery/api/models) to see how a populated database needs to look like.

* Set your database settings in config-server.js according to your MongoDb install

* Install Gulp globally:

        sudo npm install -g gulp

* Build the sample with following command: 

        gulp build-debug (for debug version - non minified)
        or
        gulp build-prod (for minified version)

* Run the server: "node server.js" from command line
* Connect to server locally using a WebGL-compatible browser: http://localhost:3000/node/gallery

Uploading your models for View & Data API:

* Apply for your own credentials at http://developer.autodesk.com
* Upload some models to your account and get their URN: see the [View & Data step by step guide](https://developer.autodesk.com/api/view-and-data-api/) for more details.
* Alternatively, use one of our other samples to easily upload your models: [this workflow sample in .net winform application](https://github.com/Developer-Autodesk/workflow-dotnet-winform-view.and.data.api/) if you are using windows or [this workflow sample in Mac OS Swift](https://github.com/Developer-Autodesk/workflow-macos-swift-view.and.data.api) if you are using Mac.
* Get your model URN from the API or sample and use it to populate your database

##Test the Live version

[Ng Gallery](http://viewer.autodesk.io/node/gallery)


## License

That samples are licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.


##Written by 

Written by [Philippe Leefsma](http://adndevblog.typepad.com/cloud_and_mobile/philippe-leefsma.html)  

