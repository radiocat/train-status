var express = require('express');
var bodyParser = require('body-parser');
var client = require('cheerio-httpcli');
var util = require('util');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.post('/', function(request, response, next) {
  
  //Dialogflowからのパラメータ取得
  const train = (function (req) {
      console.log('[REQUEST]', util.inspect(req.body,false,null));
      if (req.body && req.body.result) {
        return req.body.result.parameters.Train
      }
      return '';
  })(request);
  
  var sendResponse = function(response, word){
      //Dialogflowへ`speech`と`displayText`の情報を返す
      response.setHeader("Content-Type", "application/json");
      response.send(
        JSON.stringify({
          "speech": word , "displayText": word
        })
      );
  };
  
  if (train === "hankyu") {
    // スクレイピング開始
    client.fetch('http://www.hankyu.co.jp/railinfo/', {}, function (err, $, res) {
      console.log("access hankyu2");
      // 記事のタイトルを取得
      var word = $('.all_route > p', '#railinfo').text();
      console.log(word);
      sendResponse(response, word);
    });
  } else {
    sendResponse(response, (function (train){
      if(train){
        return train + " の" ;
      }
      return '';
    })(train) + "運行情報をお調べできませんでした");
  }

});



