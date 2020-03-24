
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var url = require('url');
var querystring = require('querystring');
var request = require('request');
var htmlparser = require('parse-entities');
var serverStatus = "ok";
const PORT = process.env.PORT || 8080;

request("https://reddit.com/", function (error, response, body) {
    if (body == undefined) {

        request("https://google.com/", function (error1, response1, body1) {

            if (body1 == undefined) {

                console.log("It seems like this application is unable to connect to the internet. [R+G No Body]");
                serverStatus = "no_internet";

            } else {

                console.log("It seems like this application is unable to connect to reddit servers. [R No Body, G Yes Body]");
                serverStatus = "no_redd";

            }

        });

    }
})

app.use(express.static('static'));

app.get('/', function (req, res) {
    res.sendFile('static/index.html');
})

app.get('/reading_stylesheet.css', function (req,res) {
    res.sendFile("static/reading_stylesheet.css");
})

app.get('/simplify.html', function (req, res) {

    console.log("---\nSimplifying page was visted");

    if (serverStatus == "ok") {
        let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        let parsedUrl = url.parse(fullUrl);
        let qsjson = querystring.parse(parsedUrl.query);

        if ( Object.keys(qsjson).length == 1 && qsjson.url.includes('redd') ) {

            var redditurl = qsjson.url.split("?")[0].replace("?","").replace("http:", "https:");

            if (redditurl.includes("redd.it")) {
                console.log("This is a reddit shortlink URL");
                console.log("URL: " + redditurl);
                var shortlink = redditurl.split("https://redd.it/")[1].replace("/","");
                console.log("Identified shortlink code: " + shortlink);

                redditurl = "https://reddit.com/" + shortlink + ".json";

            } else {
                redditurl = qsjson.url.replace("http:", "https:") + ".json";
            }

            console.log("Starting request to: " + redditurl);

            request(redditurl, function (error, response, body) {
                
                try {
                    var post_obj = JSON.parse(body);
                    var post_text_html = htmlparser(post_obj[0].data.children[0].data.selftext_html).replace(/<a href="/g,'<a href="https://redditforkindle.herokuapp.com/simplify.html?url=');
                    var post_title = htmlparser(post_obj[0].data.children[0].data.title);

                    res.write("<!doctype html><head><link rel='stylesheet' href='reading_stylesheet.css'><title>" + post_title + " (" + req.headers['user-agent'] + ")</title></head>")
                    res.write("<h1>"+post_title+"</h1>");
                    res.write(post_text_html);
                    res.write("<div class='footer'>Created by <a href='https://redditforkindle.herokuapp.com'>redditforkindle.herokuapp.com</a></div>")
                    res.end();
                    console.log("Served contents of url " + redditurl + ". Finished.");
                } catch (e) {
                    console.log('Unable to parse JSON from response body. Error: ' + e);
                    console.log('Redirecting user to main page.')
                    res.redirect(301, '/index.html?error=error_json_parse');
                }

            });

        } else {
            res.redirect(301, '/index.html?error=not_reddit');
            console.log("Redirected user, incorrect URL.");
        }
    } else {
        res.send('Sorry, the server is not currently accepting incoming requests.')
    }
});

// Listen for connections
http.listen(PORT, function(){
    console.log('listening on *:' + PORT);
})
