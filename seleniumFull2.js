"use strict";
var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var request = require('request');
var cbt = require("cbt_tunnels");
var remoteHub = 'http://hub.crossbrowsertesting.com:80/wd/hub';

var username = 'kylec@crossbrowsertesting.com'; //replace with your email address
var authkey = 'uf9b1ea5840afd70'; //replace with your authkey
var sessionId = null;


cbt.start({"username":username,"authkey": authkey,"acceptAllCerts":true}, async function(err){ 
    if(!err){ console.log("Tunnel Alive") 
        var caps = {
            name : 'CBT Tunnel Test',
            version : '17',
            platform : 'Windows 10',
            screen_resolution : '1366x768',
            record_video : 'true',
            record_network : 'false',
            browserName : 'Edge',
            username : username,
            password : authkey     
        };
        for (var i = 0; i < 1000000000; i++ ){
            await basicExample();
        }

        // //register general error handler
        // webdriver.promise.controlFlow().on('uncaughtException', webdriverErrorHandler);

        // console.log('Connection to the CrossBrowserTesting remote server');
        
        // var driver = new webdriver.Builder()
        //     .usingServer(remoteHub)
        //     .withCapabilities(caps)
        //     .build();

        // // All driver calls are automatically queued by flow control.
        // // Async functions outside of driver can use call() function.
        // console.log('Waiting on the browser to be launched and the session to start');
        // driver.getSession().then(function(session){
        //     sessionId = session.id_; //need for API calls
        //     console.log('Session ID: ', sessionId);
        //     console.log('See your test run at: https://app.crossbrowsertesting.com/selenium/' + sessionId);
        // });
        // //if its for internal site use "localhost" if its for html use "local"
        // driver.get('http://local/junk.html');//loading my url for my static site.
    

        // //Check title
        // driver.getTitle().then(function (title){
        //     if (title !== ('Tunnel Testing')) {
        //         throw Error('Unexpected title: ' + title);
        //     }
        //     console.log("The current title is: " + title);
        //     // if (driver.findElement(webdriver.By.xpath('//*[@id="linked"]')).click()) {
        //     //     console.log('LinkedIn was successfully clicked.');
        //     // }else {
        //     //     throw Error('LinkedIn was not successfully clicked.');
        //     // }
        // });

        // driver.quit();
        // //set the score as passing
        // driver.call(setScore, null, 'pass').then(function(result){
        //     console.log('set score to pass');
        //     cbt.stop();//only kills tunnel if score is passing.
        // });



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
                driver.quit();
                setScore('fail').then(function(result){
                    console.log('set score to fail')
                    cbt.stop();//kills tunnel if test fails.
                })
            }
        }
        async function basicExample(){
            try{
                var driver = new webdriver.Builder()
                    .usingServer(remoteHub)
                    .withCapabilities(caps)
                    .build(); 
                await sleep(30000);
        
                await driver.get('http://crossbrowsertesting.github.io/selenium_example_page.html');
        
                await driver.getTitle().then(function(title) {
                            console.log("The title is: " + title)
                    });
        
                driver.quit();
            }
        
            catch(err){
                handleFailure(err, driver)
            }
        
        }
        function handleFailure(err, driver) {
            console.error('Something went wrong!\n', err.stack, '\n');
            driver.quit();
       } 
       async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
        
    }

    
});