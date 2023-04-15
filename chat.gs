const LINE_ACCESS_TOKEN = '+e80bcJwYg8s2uJkMGon4UFaGq9I06KG+LCvhbTBGVu7FBtHu5FbjhUc/f+/NFgV3NS/paQbP+Wvc7WvCMPQ47LbCrx/MlPMajUwfZc4XEHcTTXcwpurMrVHUNd5coa69x2BxK9cw36ozrWz1g2sEQdB04t89/1O/w1cDnyilFU=';
const OPENAI_APIKEY = "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";

function doPost(e) {
  const event = JSON.parse(e.postData.contents).events[0];
  let userId = event.source.userId;
  const spst = SpreadsheetApp.openById("11zjx_MZtxZr_3UY6ZOn1Uar7azurkv6BIxC7pZQJLlg");
  let sheet = spst.getSheetByName(userId);
  if (!sheet) {
    sheet = spst.insertSheet(userId);
  }
  let replyToken = event.replyToken;

  let userMessage = event.message.text;
  const url = 'https://api.line.me/v2/bot/message/reply';
  if (userMessage === undefined) {
    // メッセージ以外(スタンプや画像など)が送られてきた場合
    userMessage = '？？？？';
  };

  let startRow=sheet.getLastRow()+1;
  let addRange=sheet.getRange(startRow,1,1,1);
  addRange.setValue("user");  // A列
  addRange=sheet.getRange(startRow,2,1,1);
  addRange.setValue(userMessage);  // B列
  var mrange=sheet.getSheetValues(1,1,startRow,2);
  let messages=[];
  for (let elem in mrange){
    messages.push({"role":mrange[elem][0],"content":mrange[elem][1]});
  };
  const prompt = messages;
  const requestOptions = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer "+ OPENAI_APIKEY
    },
    "payload": JSON.stringify({
      "model": "gpt-3.5-turbo",
      "messages": prompt
    })
  }
  const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", requestOptions);
  const responseText = response.getContentText();
  const json = JSON.parse(responseText);
  let text = json['choices'][0]['message']['content'].trim();
  startRow=startRow+1;
  addRange=sheet.getRange(startRow,1,1,1);
  addRange.setValue("assistant");  // A列
  addRange=sheet.getRange(startRow,2,1,1);
  addRange.setValue(text);  // B列

  if (userMessage === "リセット"){
    text='リセットしました';
    sheet.getRange(1,1,startRow+1,2).clearContent();
  }
  if (messages.length >20000){
    text='履歴が20000件を超えたため自動的に文脈をリセットしました。申し訳ありませんがもう一度質問をお願いします。';
    sheet.getRange(1,1,startRow+1,2).clearContent();
  };
  UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{
        'type': 'text',
        'text': text,
      }]
    })
  });
}


// var payload = {
//   "postData": {
//     "contents": JSON.stringify({
//       "events": [
//         {
//           "type": "message",
//           "replyToken": "00000000000000000000000000000000",
//           "source": {
//               "userId": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
//               "type": "user"
//           },
//           "timestamp": 1649653421629,
//           "mode": "active",
//           "message": {
//               "type": "text",
//               "id": "00000000000000000000000000000000",
//               "text": "Hello, ChatGPT!"
//           }
//         }
//       ]
//     })
//   }
// };
// doPost(payload);
