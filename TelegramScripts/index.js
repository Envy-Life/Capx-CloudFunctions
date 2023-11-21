const { default: axios } = require("axios");
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = ; // put your api id here
const apiHash = ""; // put your api hash here
const stringSession = ""; // leave this empty for now
const BOT_TOKEN = ""; // put your bot token here

(async () => {
  const client = new TelegramClient(
    new StringSession(stringSession),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );
  await client.start({
    botAuthToken: BOT_TOKEN,
  });

  // let params = new Api.DataJSON({
  //   "data" : "{\"chat_id\": \"testercapx1\"}"
  // })

  
  // const result = await client.invoke(
  //   new Api.bots.SendCustomRequest({
  //     "customMethod": "getMe",
  //     "params": params,}
  // ))

  let res = await axios.post("https://api.telegram.org/bot"+ BOT_TOKEN +"/" , data = {
    "chat_id": -1971259416
  } )
  console.log(res.data);
  // console.log(client.session.save());
})();