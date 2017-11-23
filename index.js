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
  const HANKYU_URL = 'http://www.hankyu.co.jp/railinfo/';
  
  if (!request.body) {
    response.status(400).send(http.STATUS_CODES[400] + '\r\n');
    return ;
  }
  console.log('[REQUEST]', util.inspect(request.body,false,null));

  //Dialogflowからのパラメータ取得
  const train = (function (result) {
      if (result) {
        return result.parameters.Train
      }
      return '';
  })(request.body.result);

  const hasScreen = (function (data) {
      if (data.surface && data.surface.capabilities) {
        for (let v of data.surface.capabilities) {
          if (v.name === 'actions.capability.SCREEN_OUTPUT'){
            console.log('ENABLE SCREEN_OUTPUT');
            return true;
          };
        };
      }
      return false;
  })(request.body.originalRequest.data);

  var createResultObject =  function (hasScreen, word, basicCard) {
      if (hasScreen) {
        return  {
          "speech": word,
          "data": {
            "google": {
              "expectUserResponse": false,
              "richResponse": {
                "items": [
                  {
                    "simpleResponse": {
                      "textToSpeech": word
                    }
                  },
                  basicCard
                ],
                "suggestions": []
              }
            },
            "possibleIntents": [
              {
                "intent": "actions.intent.TEXT"
              }
            ]
        }
      };
    }
    return {
      "speech": word , "displayText": word
    };
  };
  
  var sendResponse = function(response, resultObject){
    response.setHeader("Content-Type", "application/json");
    response.send(JSON.stringify(resultObject));
  };
  
  if (train === "hankyu") {
    // 阪急の運行情報を調べる
    client.fetch(HANKYU_URL, {}, function (err, $, res) {
      console.log("access hankyu");
      var word = $('.all_route > p', '#railinfo').text();
      // 遅れがある時だけ以下が取得できる
      $('#railinfo_02 > div:nth-child(2) > div > p').each(function (idx) {
          word = $(this).text();
      });
      console.log(word);
      var basicCard = {
        "basicCard": {
          "title": "阪急電鉄運行情報",
          "formattedText": "阪急電鉄運行状況は、4:30から25:00までの間、20分以上の遅れが発生した、もしくは見込まれる場合に情報を提供いたします。",
          "image": {
              "url": "http://www.hankyu.co.jp/images/common/logo.png",
              "accessibilityText": "阪急電鉄"
          },
          "buttons": [
            {
              "title": "Read more",
              "openUrlAction": {
                "url": HANKYU_URL
              }
            }
          ]
        }
      };

      sendResponse(response, createResultObject(hasScreen, word, basicCard));
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



