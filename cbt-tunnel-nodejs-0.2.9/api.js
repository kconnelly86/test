'use-strict';
var request = require('request');
var util = require('util');

/* 
 * Important notes:
 * - requests obeys environment variables HTTP_PROXY and HTTPS_PROXY
 * - if cbt_node returns non JSON (like on a bad error) this module will return an error
 *
 * example module use:
 *
 * get account info from prod:
 * >>> api = require('./api')(username, authkey)
 * >>> api.getAccountInfo( (err, resp, body) => console.log(body) )
 *
 * post `simpletunnel` named `bob` to test:
 * >>> api = require('./api')(username, authkey, 'test')
 * >>> api.postTunnel( 'simpletunnel', 'bob', (err, resp, body) => console.log(body) )
 *
 */

var encodeAuth = function(username, authkey){
    return (new Buffer(username+':'+authkey)).toString('base64');
}

var makeApiCall = function(server, method, path, qs, username, authkey, callback){
    // this is a generic function to make different api calls to cbt
    // console.log(`about to make a ${method} request to ${server} at ${path} for ${username}`)
    var options = {
        url: server + '/api/v3/' + path,
        method: method,
        headers: {
            authorization: 'authorized '+ encodeAuth(username, authkey)
        }
    }
    if (!!qs){
        options.qs = qs;
    }
    request(options, (err, resp, body) => {
        if( err ){
            return callback(err);
        }
        // debugger;
        // console.log(`got resp: ` + body);
        // parse resp body, or set it to parse error string
        // note: invalid json in response body WILL NOT cause an error to be thrown
        try {
            body = JSON.parse(body);
        } catch (ex) {
            console.log("Could not parse:");
            console.dir(body);
            return callback(new Error("Error parsing cbt_node response: " + ex));
        } 

        // non 200 statusCodes should return an error
        if ( !err && resp.statusCode !== 200 ) {
            return callback(Error(`statusCode from cbt_node !== 200. Got ${JSON.stringify(body)} `));
        } else {
            // all good! return parsed body
            return callback(null, body);
        }
    })
}

module.exports = function(username, authkey, env){
    // api can be called with env == argv.test
    // these first two ifs account for when env/argv.test is true/false
    if(env === true){ env = 'test'};
    if(!env){ env = 'prod' };
    switch (env.toLowerCase()) {
        case 'prod':
            var server = 'https://crossbrowsertesting.com'
            break;
        case 'test':
            var server = 'https://testapp.crossbrowsertesting.com'
            break;
        case 'local':
            var server = 'http://localhost:3000'
            break;
    }

//////////////////////////////////////////////////
////  This is the real meat of the module.    ////
////  These are the exported functions.       ////
//////////////////////////////////////////////////
    return {
        getAccountInfo: function(callback){
            makeApiCall(server, 'GET', 'account', null, username, authkey, (err, body) => {
                // console.log(`got resp for getAccountInfo`);
                return callback(err, body);
            })
        },
        postTunnel: function(tunnelType, tunnelName, bypass, secret, callback){
            makeApiCall(server, 'POST', 'tunnels', {
                tunnel_source: 'nodews',
                tunnel_type: tunnelType,
                tunnel_name: tunnelName,
                direct_resolution: bypass,
                secret: secret
            } , username, authkey, (err, body) => {
                // console.log(JSON.stringify(body));
                return callback(err, body);
            })
        },
        putTunnel: function(tunnelId, tunnelType, directory, proxyHost, proxyPort, callback){
            // console.log(`got resp for putTunnel`);
            makeApiCall(server, 'PUT', 'tunnels/' + tunnelId, {
                local_directory: directory || '',
                local_ip: proxyHost || 'localhost',
                local_port: proxyPort || '',
                message:'SUCCESS',
                state:'1',
                tunnel_source: 'nodews',
                tunnel_type: tunnelType
            }, username, authkey, (err, body) => {
                // console.log(`got resp for putTunnel`);
                return callback(err, body);
            });
        },
        deleteTunnel: function(tunnelId, callback){
            makeApiCall(server, 'DELETE', 'tunnels/' + tunnelId, {state: 10}, username, authkey, (err, resp) => {
                // console.log('got resp for deleteTunnel');
                return callback(err, resp);
            })
        },
        checkTunnelIp: function(callback){
            makeApiCall(server, 'GET', 'tunnels/checkIp', null, username, authkey, (err, resp) => {
                // console.log('got resp for checkTunnelIp');
                return callback(err, resp);
            });
        },
        getConManager: function(callback){
            makeApiCall(server, 'GET', 'localconman', null, username, authkey, (err, resp) => {
                // console.log('got resp for getConManager: ');
                // console.log(util.inspect(resp));
                return callback(err, resp);
            })
        },
        startConManagerTunnel: function(tunnelParams, callback){
            makeApiCall(server, 'POST', 'localconman', {
                local_ip: tunnelParams.proxyHost || 'localhost',
                local_port: tunnelParams.proxyPort || '',
                tunnel_type: tunnelParams.tType,
                tunnel_name: tunnelParams.tunnelName || undefined,
            }, username, authkey, (err, resp) => {
                console.log('Started tunnel remotely via Local Connection Manager');
                // wait forever
                return callback(err, resp);
            })
        }
    }
}


