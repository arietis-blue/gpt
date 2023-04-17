const LINE_ACCESS_TOKEN = '';
const OPENAI_APIKEY = "";

function doPost(e) {
  const MAX_TOKENS = 2048*0.8;

  function countTokens(messages) {
    let tokenCount = 0;
    for (let i = 0; i < messages.length; i++) {
      tokenCount += messages[i].content.split(' ').length;
    }
    return tokenCount;
  }

  const event = JSON.parse(e.postData.contents).events[0];
  let userId = event.source.userId;
  const spst = SpreadsheetApp.openById("");
  let sheet = spst.getSheetByName(userId);
  if (!sheet) {
    sheet = spst.insertSheet(userId);
  }
  let replyToken = event.replyToken;

  let userMessage = event.message.text;
  const url = '';
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
  let tokenCount = countTokens(messages); // 2
  while (tokenCount>=MAX_TOKENS) {
    messages.shift();
    tokenCount=countTokens(messages);
  }
  sheet.getRange(1,1,startRow,2).clearContent();
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
  };
  const response = UrlFetchApp.fetch("", requestOptions);
  const responseText = response.getContentText();
  const json = JSON.parse(responseText);
  let text = json['choices'][0]['message']['content'].trim();
  messages.push({"role":"assistant","content":text});
  tokenCount = countTokens(messages); // 2
  while (tokenCount>=MAX_TOKENS) {
    messages.shift();
    tokenCount=countTokens(messages);
  };
  let pm=[];
  for (let j in messages) {
    pm.push([messages[j].role,messages[j].content]);
  };
  const range = sheet.getRange(1,1,pm.length,2);
  range.setValues(pm);
  startRow=sheet.getLastRow();
  if (userMessage === "リセット"){
    text='リセットしました';
    sheet.getRange(1,1,startRow,2).clearContent();
  };
  // if (messages.length >20000){
  //   text='履歴が20000件を超えたため自動的に文脈をリセットしました。申し訳ありませんがもう一度質問をお願いします。';
  //   sheet.getRange(1,1,startRow,2).clearContent();
  // };
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





