var express = require('express');
var app = express();
var http = require('http').createServer(app);
var url = require('url');
var querystring = require('querystring');
var request = require('request');
var htmlparser = require('parse-entities');

const PORT = process.env.PORT || 8080;

app.use(express.static('static'));

app.get('/', function (req, res) {
    res.sendFile('static/index.html');
})

app.get('/reading_stylesheet.css', function (req,res) {
    res.sendFile("static/reading_stylesheet.css");
})

app.get('/simplify.html', function (req, res) {

    console.log("Simplifying page was visted");

    let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    let parsedUrl = url.parse(fullUrl);
    let qsjson = querystring.parse(parsedUrl.query);

    if ( Object.keys(qsjson).length == 1 && qsjson.url.includes('redd') ) {

        var redditurl = qsjson.url.replace("http:", "https:");

        if (redditurl.includes("redd.it")) {
            console.log("This is a reddit shortlink URL");
            request(qsjson.url, function (error, response, body) {
                if (response.statusCode > 299 && response.statusCode < 399) {
                    console.log("Grabbed actual location headers");
                    redditurl = response.headers['location'] + ".json";
                } else {
                    redditurl = qsjson.url.replace("http:", "https:") + ".json";
                }
            })
        } else {
            redditurl = qsjson.url.replace("http:", "https:") + ".json";
        }

        console.log("Starting request to: " + redditurl);

        request(redditurl, function (error, response, body) {
            
            var post_obj = JSON.parse(body);
            var post_text_html = htmlparser(post_obj[0].data.children[0].data.selftext_html).replace(/<a href="/g,'<a href="https://redditforkindle.herokuapp.com/simplify.html?url=');
            var post_title = htmlparser(post_obj[0].data.children[0].data.title);

            res.write("<!doctype html><head><link rel='stylesheet' href='reading_stylesheet.css'><title>" + post_title + " (" + req.headers['user-agent'] + ")</title></head>")
            res.write("<h1>"+post_title+"</h1>");
            res.write(post_text_html);
            res.write("<div class='footer'>Created by <a href='https://redditforkindle.herokuapp.com'>redditforkindle.herokuapp.com</a></div>")
            res.end();

        });

    } else {
        res.redirect(301, '/index.html?error=not_reddit');
    }
	
});

// Listen for connections
http.listen(PORT, function(){
    console.log('listening on *:' + PORT);
})
