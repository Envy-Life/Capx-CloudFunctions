const Discord = require("discord.js")
const { token, authNames ,TGapiHash,TGsessionId,TGapiId  } = require('./secrets.json');
const express = require('express');
const jwt_decode = require('jwt-decode');
const axios = require('axios');
const fs = require('fs');
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // npm i input
const { tgClient } = require("telegram/client");
// var mongo = require('mongodb');
const dbname = "discordBot";

// const mongoClient = new mongo.MongoClient(mongoUrl);
// let db;
// let voiceChannelActivityCollection ;

const app = express()

const client = new Discord.Client({ intents: [ Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMembers , Discord.GatewayIntentBits.GuildVoiceStates]});

let Guilds;

let TGclient;

const apiId = TGapiId;
const apiHash = TGapiHash;
const stringSession = new StringSession(TGsessionId);



client.on("ready", async () => {
    Guilds = client.guilds.cache;

    TGclient = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
      });

      console.log("Loading interactive example...");
  await TGclient.start({
    onError: (err) => console.log(err),
  });

  console.log(await TGclient.checkAuthorization() ? "Signed in successfully" : "Failed to sign in");

  await TGclient.getDialogs()

  app.listen(8080, () => {
    console.log('Bot app listening on port 8080')
})

    // await mongoClient.connect();
    // db = mongoClient.db(dbname);
    // if (db == undefined) {
    //     console.log("Error connecting to database");
    // }
    // console.log("Connected to database");
    // voiceChannelActivityCollection = db.collection("voiceChannelActivity");
    // if (voiceChannelActivityCollection == undefined) {
    //     await db.createCollection("voiceChannelActivity");
    //     voiceChannelActivityCollection = db.collection("voiceChannelActivity");
    // }
    // console.log("Connected to voiceChannelActivityCollection");
    // // db.dropCollection("voiceChannelActivity");
    
});

// client.on("voiceStateUpdate" , async (oldState, newState) => {
//     console.log("Voice State Updated");
//     // CHECKING IF THERE IS AN EVENT HAPPENING IN THE CHANNEL
//     let guild = Guilds.find(guild => guild.id == oldState.guild.id);
//     let scheduledEvents = (await guild.scheduledEvents.fetch());
//     let event1 = scheduledEvents.find(event => event.channelId == newState.channelId);
//     console.log(event1);
//     let event2 = scheduledEvents.find(event => event.channelId == oldState.channelId);
//     if (event1 == undefined && event2 == undefined) {
//         return;
//     }
//     if (event1 != undefined) {
//         if (event1.status <= 1) {
//             return;
//         }
//     }
//     if (event2 != undefined) {
//         if (event2.status <= 1) {
//             return;
//         }
//     }
    
//     // Case 1 : user joins the event
//     if (event1 != undefined) {
//         let event = event1;
//         let user = newState.id;
//         axios.post(DBFunctionUrl , {
//             eventId : event.id,
//             userId : user,
//             timeStamp : Date.now(),
//             eventType : "voiceUserJoined",
//             eventData :  {
//                 "name" : event1 == undefined ? event2.name : event1.name,
//                 "description" : event1 == undefined ? event2.description : event1.description,
//                 "startTime" : event1 == undefined ? event2.scheduledStartTimestamp : event1.scheduledStartTimestamp,
//                 "endTime" : event1 == undefined ? event2.scheduledEndTimestamp : event1.scheduledEndTimestamp,
//                 "channelId" : event1 == undefined ? event2.channelId : event1.channelId,
//                 "privacyLevel" : event1 == undefined ? event2.privacyLevel : event1.privacyLevel,
//                 "creatorId" : event1 == undefined ? event2.creatorId : event1.creatorId,
//                 "image" : event1 == undefined ? event2.image : event1.image,
//             }
//         })
//     }

//     // // Case 2 : user leaves the event
//     if (event2 != undefined) {
//         let event = event2;
//         let user = oldState.id;
//         axios.post(DBFunctionUrl , {
//             eventId : event.id,
//             userId : user,
//             timeStamp : Date.now(),
//             eventType : "voiceUserLeft",
//             eventData :  {
//                 "name" : event1 == undefined ? event2.name : event1.name,
//                 "description" : event1 == undefined ? event2.description : event1.description,
//                 "startTime" : event1 == undefined ? event2.scheduledStartTimestamp : event1.scheduledStartTimestamp,
//                 "endTime" : event1 == undefined ? event2.scheduledEndTimestamp : event1.scheduledEndTimestamp,
//                 "channelId" : event1 == undefined ? event2.channelId : event1.channelId,
//                 "privacyLevel" : event1 == undefined ? event2.privacyLevel : event1.privacyLevel,
//                 "creatorId" : event1 == undefined ? event2.creatorId : event1.creatorId,
//                 "image" : event1 == undefined ? event2.image : event1.image,
//             }
//         })
//     }

//     // let whatever = await voiceChannelActivityCollection.find({}).toArray();
//     // console.log(whatever[0].events[0].userData[0]);
// })

async function authVerify(req, res) {
    try {
        if (req.headers.authorization == undefined) {
            console.log(1);
            res.status(403).send({
                "error" : "Not Authorized"
            });
            return false;
        } else {
            req.headers.authorization = req.headers.authorization.split(" ")[1];
            let headers = jwt_decode(req.headers.authorization , {header: true});
            let payload = jwt_decode(req.headers.authorization);
            
            if (headers.alg != "RS256") {
                console.log(2);
                res.status(403).send({
                    "error" : "Not Authorized"
                });
                return false;
            }
            let resp = await axios.get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com")
            if (resp.data[headers.kid] == undefined) {
                console.log(3);
                res.status(403).send({
                    "error" : "Not Authorized"
                });
                return false;
            }
            // TODO : UNCOMMENT BEFORE DEPLOYMENT
            if (payload.exp > Date.now() && payload.iat < Date.now()) {
                console.log(4);
                res.status(403).send({
                "error" : "Not Authorized"
            });
                return false;
            }
            if (authNames.indexOf(payload.aud) == undefined) {
                console.log(5);
                res.status(403).send({
                    "error" : "Not Authorized"
                });
                return false;
            }
            if (authNames.map(x => "https://securetoken.google.com/" + x).indexOf(payload.iss) == undefined) {
                console.log(6);
                res.status(403).send({
                    "error" : "Not Authorized"
                });
                return false;
            }
            return true;
        }
    } catch (error) {
        console.log(7);
        console.log(error);
        res.status(403).send({
            "error" : "Not Authorized"
        });
        return false
    }
}

app.get("/" , async(req, res) => {
    res.status(200).send({
        "success" : true,
        "message" : "API is running"
    })
})


//ERROR HANDLING

app.get('/checkUserJoined', async(req, res) => {
    if (!await authVerify(req, res)) {
        return;
    }

    try {
        if (!req.query.guildId || !req.query.userId || !req.query.role) {
            res.status(400).send({
                "success" : false,
                "error" : "Invalid Request. Missing one (or) more parameters from guildId, userId, role",
                "message" : `Invite Request. Request Params - ${JSON.stringify(req.query)}`
            });
            return;
        }
        let id = req.query.guildId
        let members = await Guilds.find(g => g.id === id).members.fetch()
        let member = members.find(m => (m.user.id === req.query.userId))
        if (member != undefined) {
            let roles = member.roles.cache.map(r => r.name)
            res.status(200).send({
                "success" : roles.includes(req.query.role) ? true : false,
                "message" : roles.includes(req.query.role) ? "Validation Successful" : "User is not verified in the server",
                "error" : roles.includes(req.query.role) ? undefined : "User " + req.query.userId + " has not been verified in " + id

            });  
        } else {
            res.status(200).send({
                "success" : false,
                "error" : "User " + req.query.userId + " has not joined " + id, 
                "message" : "User has not joined the server"
            });
        }
        
    } catch (error) {
        res.status(400).send({
            "success" : false,
            "error" : "Internal Server Error " + error.message,
            "message" : "Validation Failed"
        });
    }
    
})

app.get('/checkUserReacted', async(req, res) => {
    if (!await authVerify(req, res)) {
        return;
    }
    try {
        if (!req.query.guildId || !req.query.channelId || !req.query.messageId || !req.query.userId || !req.query.emoji) {
            res.status(400).send({
                "success" : false,
                "error" : "Invalid Request. Missing one (or) more parameters from guildId, channelId, messageId, userId, emoji",
                "message" : `Invite Request. Request Params - ${JSON.stringify(req.query)}`
            });
            return;
        }
        let id = req.query.guildId
        let channels = await (Guilds.find(g => g.id === id)).channels.fetch(); 
        let messages = await channels.find(c => c.id === req.query.channelId).messages.fetch()
        let message = messages.find(m => m.id === req.query.messageId)
        message.reactions.cache.find(r => r.emoji.name === req.query.emoji).users.fetch().then(users => {
            let result = users.find(u => (u.id === req.query.userId)) ? true : false
            res.status(200).send({
                "success" : result,
                "error" : result ? undefined : "User " + req.query.userId + " has not reacted with " + req.query.emoji + " on " + req.query.messageId,
                "message" : result ? "Validation Successful" : "User has not reacted"
            });
        })
    } catch (error) {
        res.status(400).send({
            "success" : false,
            "error" : "Internal Server Error " + error.message,
            "message" : "Validation Failed"
        });
    }
    
})

app.get('/checkUserHasRole', async(req, res) => {
    if (!await authVerify(req, res)) {
        return;
    }
    try {
        if (!req.query.role || !req.query.guildId || !req.query.userId) {
            res.status(400).send({
                "success" : false,
                "error" : "Invalid Request. Missing one (or) more parameters from role, guildId, userId",
                "message" : `Invite Request. Request Params - ${JSON.stringify(req.query)}`
            });
            return;
        }
        let id = req.query.guildId
        let members = await Guilds.find(g => g.id === id).members.fetch()
        let member = members.find(m => (m.user.id === req.query.userId))
        let roles = member.roles.cache.map(r => r.name)
        res.status(200).send({
            "success" : roles.includes(req.query.role) ? true : false,
            "error" : roles.includes(req.query.role) ? undefined : "User " + req.query.userId + " does not have " + req.query.role,   
            "message" : roles.includes(req.query.role) ? "Validation Successful" : "User does not have the role"
        });  
    } catch (error) {
        res.status(400).send({
            "success" : false,
            "error" : "Internal Server Error " + error.message,
            "message" : "Validation Failed"
        });
    }
})

app.get('/checkUserMessage', async(req, res) => {
    // ADD STRING CHECK
    if (!await authVerify(req, res)) {
        return;
    }
    try {
        if (!req.query.message || !req.query.userId || !req.query.guildId || !req.query.channelId) {
            res.status(400).send({
                "success" : false,
                "error" : "Invalid Request. Missing one (or) more parameters from message, userId, guildId, channelId",
                "message" : `Invite Request. Request Params - ${JSON.stringify(req.query)}`
            });
            return;
        }

        let id = req.query.guildId
        let channels = await (Guilds.find(g => g.id === id)).channels.fetch(); 
        let limit = req.query.limit ? req.query.limit : 10;
        let messages = await channels.find(c => c.id === req.query.channelId).messages.fetch()
        let message = messages.filter(m => m.author.id === req.query.userId)
        let temp=Array.from(message.values())
        
        let result = false;
        
        for(let i=0;i< message.size ;i++){
            if (temp[i].content.includes(req.query.message)){
                result = true;
                break;
            }
        }
        res.status(200).send({
            "success" : result,
            "error" : result ? undefined : "User " + req.query.userId + " has not sent a message containing " + req.query.message + " in " + req.query.channelId,
            "message" : result ? "Validation Successful" : "User has not sent the message"
        });
    } catch (error) {
        res.status(400).send({
            "success" : false,
            "error" : "Internal Server Error " + error.message,
            "message" : "Validation Failed"
        });
    }

})

app.get('/checkUserInVoice' , async(req, res) => {
    if (!await authVerify(req, res)) {
        return;
    }
    try {
        if (!req.query.channelId || !req.query.userId || !req.query.guildId) {
            res.status(400).send({
                "success" : false,
                "error" : "Invalid Request. Missing one (or) more parameters from channelId, userId, guildId",
                "message" : `Invite Request. Request Params - ${JSON.stringify(req.query)}`
            });
            return;
        }
        let id = req.query.guildId
        let channels = await (Guilds.find(g => g.id === id)).channels.fetch(); 
        let channel = await channels.find(c => c.id === req.query.channelId)
        let members = await channel.members
        let result = members.find(m => (m.user.id === req.query.userId)) ? true : false
        res.status(200).send({
            "success" : result,
            "error" : result ? undefined : "User " + req.query.userId + " is not in " + req.query.channelId,
            "message" : result ? "Validation Successful" : "User is not in the voice channel"
        });
    } catch (error) {
        res.status(400).send({
            "success" : false,
            "error" : "Internal Server Error " + error.message,
            "message" : "Validation Failed"
        });
    }
})

app.get('/checkUserSubscribedToEvent' , async(req, res) => {
    if (!await authVerify(req, res)) {
        return;
    }
    try {
        if (!req.query.guildId || !req.query.eventId || !req.query.userId) {
            res.status(400).send({
                "success" : false,
                "error" : "Invalid Request. Missing one (or) more parameters from guildId, eventId, userId",
                "message" : `Invite Request. Request Params - ${JSON.stringify(req.query)}`
            });
            return;
        }

        let id = req.query.guildId
        let guild = await Guilds.find(g => g.id === id)
        let scheduledEvents = (await guild.scheduledEvents.fetch());
        let event = scheduledEvents.find(e => e.id === req.query.eventId)
        let subscribers = await event.fetchSubscribers()
        let result = subscribers.find(m => (m.user.id === req.query.userId)) ? true : false
        
        res.status(200).send({
            "success" : result,
            "error" : result ? undefined : "User " + req.query.userId + " is not subscribed to " + req.query.eventId,
            "message" : result ? "Validation Successful" : "User is not subscribed to the event"
        });
    } catch (error) {
        res.status(400).send({
            "success" : false,
            "error" : "Internal Server Error " + error.message,
            "message" : "Validation Failed"
        });
    }
})

app.get('/checkUserServerInvites' , async(req, res) => {
    if (!await authVerify(req, res)) {
        return;
    }
    try {
        if (
            req.query.guildId &&
            req.query.userId &&
            req.query.code &&
            req.query.invites
        ) {
            const id = req.query.guildId;
            const userId = req.query.userId;
            const code = req.query.code;
            const noOfInvites = req.query.invites;
    
            let guild = await Guilds.find(g => g.id === id);
            let invites = await guild.invites.fetch();
            let result = invites.filter((invite) => invite.code === code);
    
            const resultObj = Object.fromEntries(result);
            if (Object.keys(resultObj).length > 0) {
                // console.log(
                //     {
                //         code: code,
                //         guildId: id,
                //         temporary: resultObj[`${code}`].temporary,
                //         maxAge: resultObj[`${code}`].maxAge,
                //         maxUses: resultObj[`${code}`].maxUses,
                //         uses: resultObj[`${code}`].uses,
                //         inviterId: resultObj[`${code}`].inviterId,
                //         createdTimestamp: resultObj[`${code}`].createdTimestamp,
                //         expiresTimestamp: resultObj[`${code}`]._expiresTimestamp,
                //         url: `https://discord.gg/${code}`
                //     }
                // );
                const noOfUsedInvites = Number(resultObj[`${code}`].uses);
                const inviterId = resultObj[`${code}`].inviterId;
                if (inviterId === userId) {
                    if (noOfUsedInvites >= noOfInvites) {
                        res.status(200).json({
                            success: true,
                            message: `User has invited ${noOfUsedInvites}`,
                            error: `None`
                        });
                    } else {
                        res.status(200).json({
                            success: false,
                            message: `User has invited only ${noOfUsedInvites}/${noOfInvites}`,
                            error: `User has not invited enough members.`
                        });
                    }
                } else {
                    res.status(200).json({
                        success: false,
                        message: `Invalid Invite Code for user.`,
                        error: `Invite code mismatch. Expected ${userId} got ${inviterId}`
                    });
                }
            } else {
                res.status(200).json({
                    success: false,
                    message: `Invalid Invite Code for the server`,
                    error: `Invite Code doesn't belong in the guild`
                })
            }
        } else {
            res.status(400).json({
                success: false,
                message: `Invalid Request. Missing one (or) more parameters from guildId, userId, code, invites`,
                error: `Invite Request. Request Params - ${JSON.stringify(req.query)}`
            })
        }
    } catch (error) {
        res.status(500).send({
            "success" : false,
            "error" : "Internal Server Error " + error.message,
            "message" : "Validation Failed"
        });
    }
});

function minimum (a,b){
    return a<b ? a : b;
}

app.get("/checkUserInServer", async (req, res) => {
    try {
        if (!await authVerify(req, res)) {
            return;
        }
        if (!req.query.channelName || !req.query.userName) {
            res.status(400).send({
                "success" : false,
                "error" : "Invalid Request. Missing one (or) more parameters from channelName, userName",
                "message" : `Invite Request. Request Params - ${JSON.stringify(req.query)}`
            });
            return;
        }
    const channelName = req.query.channelName;
    const userName = req.query.userName;
    let isJoined = false;
    try {
        // await TGclient.getParticipants(channelName)
        await TGclient.invoke(
            new Api.channels.GetParticipant({
              "channel" : channelName,
              "participant" : userName
            })
          )
          
        isJoined = true;
    } catch (error) {
        console.log(error.message);
        
            let participants = await TGclient.getParticipants(channelName)
            
            try {
                await TGclient.invoke(
                    new Api.channels.GetParticipant({
                      "channel" : channelName,
                      "participant" : userName
                    })
                  )
                  
                isJoined = true;
            } catch (error) {
                for (let i = 0; i < participants.length; i++) {                
                    if (participants[i].username == (userName) || participants[i].id.value == userName) {
                        console.log(participants[i].id.value );
                      isJoined = true;
                      break;
                    }
                  }
            }
    }
    res.send({
      "success" : isJoined,
      "message" : isJoined ? "Validation Successful" : "User has not joined the server",
      "error" : isJoined ? undefined : "User "+ userName +" has not joined the server"
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

// app.get('/checkUserAttendedEvent' , async(req, res) => {
//     if (!await authVerify(req, res)) {
//         return;
//     }
//     try {
        // let [username , discriminator] = await usernameExtract(req.query.username.split("#")[0] , req.query.username.split("#")[1] , req.query.guildId);
//         let id = req.query.guildId
//         let guild = await Guilds.find(g => g.id === id)
//         let members =await guild.members.fetch()
//         let memId = members.find(m => (m.user.id === req.query.userId)).id
//         return res.status(200).send((await axios.post(DBFunctionUrl , {
//             "eventType" : "checkUserAttendedEvent",
//             "eventId" : req.query.eventId,
//             "userId" : memId
//         })).data)
//     } catch (error) {
//         res.status(400).send({
//             "success" : false,
//             "error" : "Internal Server Error " + error.message,
//             "message" : "Validation Failed"
//         });
//     }
// })

client.login(token)