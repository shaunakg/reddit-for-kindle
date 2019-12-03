var express = require('express');
var app = express();
var http = require('http').createServer(app);
var url = require('url');
var querystring = require('querystring');
var request = require('request');

const PORT = process.env.PORT || 8080;

app.use(express.static('static'));

app.get('/', function (req, res) {
    res.sendFile('static/index.html');
})

app.get('/simplify.html', function (req, res) {

    console.log("Request to simplify.html");

    let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    let parsedUrl = url.parse(fullUrl);
    let qsjson = querystring.parse(parsedUrl.query);

    if ( Object.keys(qsjson).length == 1 && qsjson.url.includes('redd') ) {

        let redditurl = qsjson.url + ".json";
        res.send(redditurl);

        request(redditurl, function (error, response, body) {
            
        });

    } else {
        res.redirect(301, '/index.html?error=not_reddit');
    }
	
});

// Listen for connections
http.listen(PORT, function(){
    console.log('listening on *:' + PORT);
})
