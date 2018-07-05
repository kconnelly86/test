"use strict";
var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var request = require('request');
var cbt = require("cbt_tunnels");
var remoteHub = 'http://hub.crossbrowsertesting.com:80/wd/hub';

var username = 'kconnelly1986@gmail.com'; //replace with your email address
var authkey = 'ue9726cb7ce98ade'; //replace with your authkey
var sessionId = null;


cbt.start({"username":username,"authkey": authkey,"dir":"~/Bootcamp/portfolio/"}, function(err){ 
    if(!err){ console.log("ALIVE") 
        var caps = {
            name : 'Challenge',
            //build :  '1.0',
            version : '59x64',
            platform : 'Mac OSX 10.12',
            screen_resolution : '1024x768',
            record_video : 'true',
            record_network : 'false',
            browserName : 'Chrome',
            username : username,
            password : authkey
        };

        //register general error handler
        webdriver.promise.controlFlow().on('uncaughtException', webdriverErrorHandler);

        console.log('Connection to the CrossBrowserTesting remote server');

        var driver = new webdriver.Builder()
            .usingServer(remoteHub)
            .withCapabilities(caps)
            .build();

        // All driver calls are automatically queued by flow control.
        // Async functions outside of driver can use call() function.
        console.log('Waiting on the browser to be launched and the session to start');
        driver.getSession().then(function(session){
            sessionId = session.id_; //need for API calls
            console.log('Session ID: ', sessionId);
            console.log('See your test run at: https://app.crossbrowsertesting.com/selenium/' + sessionId);
        });
        driver.get('http://local/index.html');//loading my url for my static site.
    

        //Check title
        driver.getTitle().then(function (title){
            if (title !== ('local')) {
                throw Error('Unexpected title: ' + title);
            }
            console.log("The current title is: " + title);
        });

        driver.quit();
        //set the score as passing
        driver.call(setScore, null, 'pass').then(function(result){
            console.log('set score to pass');
            //cbt.stop();//only kills tunnel if score is passing.
        });



        function setScore(score) {
            //webdriver has built-in promise to use
            var deferred = webdriver.promise.defer();
            var result = { error: false, message: null }
            if (sessionId){
                request({
                    method: 'PUT',
                    uri: 'https://crossbrowsertesting.com/api/v3/selenium/' + sessionId,
                    body: {'action': 'set_score', 'score': score },
                    json: true
                },
                function(error, response, body) {
                    if (error) {
                        result.error = true;
                        result.message = error;
                    }
                    else if (response.statusCode !== 200){
                        result.error = true;
                        result.message = body;
                    }
                    else{
                        result.error = false;
                        result.message = 'success';
                    }

                    deferred.fulfill(result);
                })
                .auth(username, authkey);
            }
            else{
                result.error = true;
                result.message = 'Session Id was not defined';
                deferred.fulfill(result);
            }

            return deferred.promise;
        }



        //general error catching function
        function webdriverErrorHandler(err){

        console.error('There was an unhandled exception! ' + err);

            //if we had a session, end it and mark failed
            if (driver && sessionId){
                //driver.quit();
                setScore('fail').then(function(result){
                    console.log('set score to fail')
                    //cbt.stop();//kills tunnel if test fails.
                })
            }
        }
    }

    
});