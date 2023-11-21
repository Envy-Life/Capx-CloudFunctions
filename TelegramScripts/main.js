const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // npm i input
const express = require("express");
const fs = require("fs");
const app = express();

const apiId = ;
const apiHash = "";
const stringSession = new StringSession(""); // fill this later with the value from session.save()

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

(async () => {
  console.log("Loading interactive example...");
  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  console.log(await client.checkAuthorization() ? "Signed in successfully" : "Failed to sign in");

  await client.getDialogs()

  app.listen(8080 , () => {
    console.log("Server started on port 8080");
  })
  
  

})();

app.get("/" , (req, res) => {
  res.send("Server is running");
})

app.get("/checkUserJoinedChannel", async (req, res) => {
  try {
    // await client.getDialogs()
  const channelName = req.query.channelName;
  const userId = req.query.userId;
  const userName = req.query.userName;
  let participants = await client.invoke({
    new Api.channels.GetParticipant({
      "channel": channelName,
      "participant": userName
    })
  })
  // fs.writeFileSync("participants.json", JSON.stringify(participants));
  let isJoined = false;
  for (let i = 0; i < participants.length; i++) {
    if (participants[i].id.equals(userId)) {
      isJoined = true;
      break;
    }
  }
  res.send({
    "success" : isJoined,
    "message" : isJoined ? "Validation Successful" : "User has not joined the server",
    "error" : isJoined ? undefined : "User "+ userId +" has not joined the server"
  });
  return;
  } catch (error) {
    res.status(500).send({
      "success" : false,
      "message" : "Internal Server Error",
      "error" : "Internal server error" + error.message
  })
  return;
}
})
