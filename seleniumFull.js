"use strict";
var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var request = require('request');
var cbt = require("cbt_tunnels");
var remoteHub = 'http://hub.crossbrowsertesting.com:80/wd/hub';

var username = 'kconnelly1986@gmail.com'; //replace with your email address
var authkey = 'ue9726cb7ce98ade'; //replace with your authkey

cbt.start({"username":username,"authkey": authkey,"dir":"~/Bootcamp/portfolio"}, function(err){ if(!err) console.log("ALIVE") 
driver.getSession().then(function(session){
    sessionId = session.id_; //need for API calls
    //cbt.start({"username":username,"authkey": authkey,"dir":"~/Bootcamp/portfolio"}, function(err){ if(!err) console.log("ALIVE")});//specifying the 'root' directory that this web server points to.
    console.log('Session ID: ', sessionId);
    console.log('See your test run at: https://app.crossbrowsertesting.com/selenium/' + sessionId);
    //driver.findElement(webdriver.By.id("linked")).click();//grabbing the id linked to click it and test.
});
driver.get('http://local/index.html');//loading my url for my static site.
});//specifying the 'root' directory that this web server points to.

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

var sessionId = null;

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

/*driver.getSession().then(function(session){

    sessionId = session.id_; //need for API calls
    //cbt.start({"username":username,"authkey": authkey,"dir":"~/Bootcamp/portfolio"}, function(err){ if(!err) console.log("ALIVE")});//specifying the 'root' directory that this web server points to.
    console.log('Session ID: ', sessionId);
    console.log('See your test run at: https://app.crossbrowsertesting.com/selenium/' + sessionId);
    driver.get('http://local/index.html');//loading my url for my static site.
    //driver.findElement(webdriver.By.id("linked")).click();//grabbing the id linked to click it and test.
});*/

//load your URL
//driver.get('http://crossbrowsertesting.github.io/login-form.html');
//driver.get('http://local/index.html');

//Kyle
//Local HTML File to host the static site.
//cbt.start({"username":username,"authkey": authkey,"dir":"~/Bootcamp/portfolio"}, function(err){ if(!err) console.log("ALIVE")});
//driver.get('http://local/index.html');

//take snapshot via cbt api
driver.call(takeSnapshot);

//take snapshot via cbt api
driver.call(takeSnapshot);

//Check title
driver.getTitle().then(function (title){
    if (title !== ('local')) {
        throw Error('Unexpected title: ' + title);
    }
    console.log("The current title is: " + title);
});

//find linked in icon and click it
//driver.findElement(webdriver.By.id("linked")).click();
//driver.find_element_by_xpath('//*[@id="linked"]').click();
//driver.findElement(webdriver.By.xpath('//*[@id="linked"]')).click();

//quit the driver
//driver.quit();

//set the score as passing
driver.call(setScore, null, 'pass').then(function(result){
    console.log('set score to pass');
    //cbt.stop();//only kills tunnel if score is passing.
});



//Added the 'cbt.stop' after the test fails script has run.
//-----SETTING SCORE, API SNAPSHOT, GENERAL ERROR CATCHING---------//
//Call API to set the score
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

//Call API to get a snapshot
function takeSnapshot() {

    //webdriver has built-in promise to use
    var deferred = webdriver.promise.defer();
    var result = { error: false, message: null }

    if (sessionId){
        request.post(
            'https://crossbrowsertesting.com/api/v3/selenium/' + sessionId + '/snapshots',
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
            }
        )
        .auth(username,authkey);

    }
    else{
        result.error = true;
        result.message = 'Session Id was not defined';
        deferred.fulfill(result); //never call reject as we don't need this to actually stop the test
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
