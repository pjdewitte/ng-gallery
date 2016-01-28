/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2015 - ADN/Developer Technical Services
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
/////////////////////////////////////////////////////////////////////////////////
var webdriver = require('selenium-webdriver'),
  logging = webdriver.logging,
  chrome = require('selenium-webdriver/chrome'),
  chromePath = require('chromedriver').path,
  async = require('async'),
  until = webdriver.until,
  path = require('path'),
  By = webdriver.By;

/////////////////////////////////////////////////////////////
// initializes driver with chrome support
//
/////////////////////////////////////////////////////////////
function runChrome() {

  var service = new chrome.ServiceBuilder(chromePath).build();
  chrome.setDefaultService(service);

  var browser = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

  return browser;
}

/////////////////////////////////////////////////////////////
// initializes driver with firefox
//
/////////////////////////////////////////////////////////////
function runFirefox() {

  var prefs = new logging.Preferences();

  prefs.setLevel(logging.Type.BROWSER, logging.Level.INFO);

  var browser = new webdriver.Builder()
    .setLoggingPrefs(prefs)
    .forBrowser('firefox')
    .build();

  return browser;
}

/////////////////////////////////////////////////////////////
// run driver and set webpage
//
/////////////////////////////////////////////////////////////
var browser = runFirefox();

browser.get('http://gallery.autodesk.io');

/////////////////////////////////////////////////////////////
// home page loaded handler
//
/////////////////////////////////////////////////////////////
function onHomePageLoaded() {

  var btnId = "btn-load-560c6c57611ca14810e1b2bf";

  browser.wait(until.elementLocated(
    By.id(btnId)), 30 * 1000).then(function(element) {

    var input = browser.findElement(By.id('input-home-search'));

    input.sendKeys('engine');

    browser.sleep(1000);

    element.click();

    browser.wait(until.titleIs('Gallery - Engine'), 30 * 1000).then(
      onModelOpened);
  });
}

/////////////////////////////////////////////////////////////
// model page loaded handler
//
/////////////////////////////////////////////////////////////
function onModelOpened() {

  //Locate Extension Manager control
  var btnId = "Autodesk.ADN.Gallery.ExtensionManager.Button.Manage";

  browser.wait(until.elementLocated(
    By.id(btnId)), 30 * 1000).then(function(element) {

    //displays extensions panel
    element.click();

    browser.sleep(2000);

    //list all extension items
    browser.findElements(
      By.className('extension-item')).then(
      function(elements) {

        var extensions = [];

        async.each(elements,
          function(item, cb){

            item.getText().then(function(displayName) {

              extensions.push(displayName);
              cb();
            });
          },
          function(err){

            extensions.forEach(function(extension) {

              loadExtension(extension);

              browser.sleep(1000);
            });
         });
      });

    browser.sleep(15000);
  });
}

/////////////////////////////////////////////////////////////
// load/unload extension by name
//
/////////////////////////////////////////////////////////////
function loadExtension(displayName) {

  //locate search input
  browser.findElement(
    By.className('extension-search')).then(
      function(searchInput) {

        searchInput.clear();

        //filter extension by display name
        searchInput.sendKeys(displayName);

        browser.findElements(
          By.className('extension-item')).then(
          function(items) {

            items.forEach(function (item) {

              item.getText().then(function (text) {

                if(text === displayName) {

                  item.click();

                  browser.sleep(2000);

                  // attempts to dump browser console, but doesn't seem to work ...
                  browser.manage().logs().get(logging.Type.BROWSER).then(
                    function(entries) {
                      console.log(entries);
                    });

                  // some extensions use alert, need special handling
                  // to accept the dialog
                  browser.wait(until.alertIsPresent(), 1000).then(
                    function() {

                      browser.switchTo().alert();
                      browser.switchTo().alert().accept();
                      browser.switchTo().defaultContent();

                      // unload and accept alert
                      item.click();

                      browser.switchTo().alert();
                      browser.switchTo().alert().accept();
                      browser.switchTo().defaultContent();

                    },  function() {

                      // unload
                      item.click();
                    });
                }
              });
            });
          });
    });
}

/////////////////////////////////////////////////////////////
// wait for home page loaded
//
/////////////////////////////////////////////////////////////
browser.wait(until.titleIs('View & Data Gallery'), 30 * 1000).then(
  onHomePageLoaded);

browser.quit();
