var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var async = require('async');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/webcrawl', function(req, res){
  console.log("Entered back-end");

  var START_URL = "" + req.body.website;
  var SEARCH_WORD = "" + req.body.word;
  var MAX_PAGES_TO_VISIT = 10;

  var pagesVisited = {};
  var numPagesVisited = 0;
  var pagesToVisit = [];
  var url = new URL(START_URL);
  var baseUrl = url.protocol + "//" + url.hostname;
  var result_string = "";
  console.log(req.body);
  pagesToVisit.push(START_URL);
  crawl();

  function crawl() {
    if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
      result_string = result_string + "Reached max limit of number of pages to visit.<br>";
      res.send(result_string);
      return;
    }
    var nextPage = pagesToVisit.pop();
    if (nextPage in pagesVisited) {
      // We've already visited this page, so repeat the crawl
      crawl();
    } else {
      // New page we haven't visited
      visitPage(nextPage, crawl);
    }
  }

  function visitPage(url, callback) {
    // Add page to our set
    pagesVisited[url] = true;
    numPagesVisited++;

    // Make the request
    result_string = result_string + " Visiting page " + url + "<br>";
    request(url, function(error, response, body) {
       // Check status code (200 is HTTP OK)
       console.log("Status code: " + response.statusCode);
       if(response.statusCode !== 200) {
         callback();
         return;
       }
       // Parse the document body
       var $ = cheerio.load(body);
       var isWordFound = searchForWord($, SEARCH_WORD);
       if(isWordFound) {
         result_string = result_string + ' Word ' + SEARCH_WORD + ' found at page ' + url+"<br>";
         console.log(result_string);
         res.send(result_string);
       } else {
         collectInternalLinks($);
         // In this short program, our callback is just calling crawl()
         callback();
       }
    });
  }

  function searchForWord($, word) {
    var bodyText = $('html > body').text().toLowerCase();
    return(bodyText.indexOf(word.toLowerCase()) !== -1);
  }

  function collectInternalLinks($) {
      var relativeLinks = $("a[href^='/']");
      result_string = result_string + " Found " + relativeLinks.length + " relative links on page<br>";
      relativeLinks.each(function() {
          pagesToVisit.push(baseUrl + $(this).attr('href'));
      });
  }

});

module.exports = router;
