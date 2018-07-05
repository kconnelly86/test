var username = 'kconnelly1986@gmail.com';
var authkey = 'ue9726cb7ce98ade';
var cbt = require("cbt_tunnels");


var webdriver = require('selenium-webdriver');
    SeleniumServer = require('selenium-webdriver/remote').SeleniumServer,
    request = require("request");




var remoteHub = "http://" + username + ":" + authkey + "@hub.crossbrowsertesting.com:80/wd/hub";

//Kyle
//Local HTML File to host the static site.

//cbt.start({"username":username,"authkey": authkey,"ready":"readyFile.txt"},function(err){ if(!err) console.log('READY') });
cbt.start({"username":username,"authkey": authkey,"dir":"~/Bootcamp/portfolio"}, function(err){ if(!err) console.log("ALIVE")});
//cbt.start({"username":username,"authkey": authkey,"kill":"killFile.txt"},function(err){ if(!err) console.log('DEAD') })

var browsers = [
   //{ browserName: 'Firefox', platform: 'Windows 7 64-bit', version: '53', screen_resolution: '1024x768' },
   { browserName: 'Chrome', platform: 'Mac OSX 10.12', version: '59x64', screen_resolution: '1024x768' },
   //{ browserName: 'Internet Explorer', platform: 'Windows 8.1', version: '11', screen_resolution: '1024x768' }
];

var flows = browsers.map(function(browser) {

        var caps = {
            name : 'Node Parallel Example',
            browserName : browser.browserName,
            version : browser.version,
            platform : browser.platform,
            screen_resolution : browser.screen_resolution,
            username : username,
            record_video: true,
            password : authkey,
        };


        var driver = new webdriver.Builder()
             .usingServer(remoteHub)
             .withCapabilities(caps)
             .build();

        driver.getSession().then(function(session){
            var sessionId = session.id_;
            console.log("Session ID :" + sessionId);
            driver.get('http://local/index.html');

            driver.getTitle().then(function(title) {
                if (title !== ('')) {
                    throw Error('Unexpected title: ' + title);
                }
            });
            cbt.stop();
            driver.quit();

    });
});