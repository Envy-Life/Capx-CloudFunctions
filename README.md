# Cloud Functions

~~~
NOTE

These functions are currently `NOT` deployed. 
~~~

## Running the functions locally
```
cd functions

./node_modules/.bin/eslint src --fix

npm run-script build

firebase serve
```

## checkIfUsernameAvailable
Allows authenticated user to check if `username` is available.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/checkIfUsernameAvailable 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/checkIfUsernameAvailable' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
	"username" : "<username>"
  }
}'
```
---

## checkIfInviteCodeValid
Allows authenticated user to check if `invite_code` is valid.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/checkIfInviteCodeValid 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/checkIfInviteCodeValid' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
	  "invite_code" : "<invite_code>"
  }
}'
```
---
## createUserProfile
Allows authenticated user to create their profile.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/createUserProfile 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/createUserProfile' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "name": "<name>",
	  "username" : "<username>",
    "invite_code" : "<invite_code>
  }
}'
```
---
## linkUserTwitter

Allows authenticated user to link their `Twitter Account`.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/linkUserTwitter 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/linkUserTwitter' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TWITTER_TOKEN' \
--data-raw '{
  "data" : {}
}'
```
---
## linkUserGoogle

Allows authenticated user to link their `Google Account`.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/linkUserGoogle 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/linkUserGoogle' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer GOOGLE_TOKEN' \
--data-raw '{
  "data" : {}
}'
```
---
## linkUserEVMWallet

Allows authenticated user to link their `ethereum` addrress.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/linkUserEVMWallet 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/linkUserEVMWallet' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "evm_address" : "<address>"
  }
}'
```
---
## linkUserSOLWallet

Allows authenticated user to link their `solana` addrress.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/linkUserSOLWallet 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/linkUserSOLWallet' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "sol_address" : "<address>"
  }
}'
```
---
## updateUserProfileImg

Updates profile image of an authenticated user.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/updateUserProfileImg 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/updateUserProfileImg' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "image_url" : "<image_url>"
  }
}'
```
---
## updateUserFullName

Updates `Name` of an authenticated user.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/updateUserFullName 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/updateUserFullName' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "name" : "<name>"
  }
}'
```
---
## adminCreateOrg

Creates an Organisation by authorized user.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/adminCreateOrg 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/adminCreateOrg' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "name" : "Capx",
    "description" : "Democratising Financial Markets",
    "tags" : ["DEFI","WVTs","DEX"],
    "website" : "https://capx.fi"
  }
}'
```
---
## adminCreateOrgQuest

Creates a Quest for an underlying organisation by an authorized user.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/adminCreateOrgQuest 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/adminCreateOrgQuest' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "title" : "Connect Twitter",
    "description": "Link your Twitter acount with Capx App.",
    "cta_title" : "Connect your Twitter Account",
    "rewards_type": "Level",
    "reward": "1",
    "expiry": "2022-12-25",
    "quest_type" : "Special / Daily / DailyReward",
    "quest_day" : "DAY<number>",
    <!-- "start_date" : "date" (incase of Action Type `Notify` (or) incase the Quest type is `Special` type.) -->
    "actions" : [
      {
        "title" : "Watch Video",
        "type" : "Video",
        "cta_title" : "Watch Video & Earn Rewards",
        "media_link" : "https://link",
        "action_reward_amount" : <number>
      }
    ],
    "tags" : ["Twitter","Social Media"]
  }
}'
```

### Types of Action Object

#### Quest Type - Daily | ActionType - Quiz
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Quiz",
  "question" : "<string>",
  "answer" : "<string>",
  "options" : ["<string>",...],
  "action_reward_amount" : <number>
}
```

#### Quest Type - Daily | ActionType - Social_Twitter
- `checkIfUserFollows` - Check if a user follows a particular twitter account.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Twitter",
  "verification_engine" : "checkIfUserFollows",
  "twitter_id_to_follow" : "<string>",
  "action_reward_amount" : <number>
}
```

- `checkIfUserLikedTweet` - Check if a user has liked a particular tweet.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Twitter",
  "verification_engine" : "checkIfUserLikedTweet",
  "tweet_url" : "<string>",
  "action_reward_amount" : <number>
}
```

- `checkIfUserQuoted` - Check if a user has tweet quoted on a particular tweet.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Twitter",
  "verification_engine" : "checkIfUserQuoted",
  "tweet_url" : "<string>",
  "action_reward_amount" : <number>
}
```

- `checkIfUserCommented` - Check if a user has commented on a particular tweet.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Twitter",
  "verification_engine" : "checkIfUserCommented",
  "tweet_url" : "<string>",
  "action_reward_amount" : <number>
}
```

- `checkIfUserRetweeted` - Check if a user has retweeted on a particular tweet.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Twitter",
  "verification_engine" : "checkIfUserRetweeted",
  "tweet_url" : "<string>",
  "action_reward_amount" : <number>
}
```

- `checkUserTweet` - Check if a user tweet contains the required strings.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Twitter",
  "verification_engine" : "checkUserTweet",
  "tweet_strings": ["<string>"],
  "action_reward_amount" : <number>
}
```

- `info` - Provides the information corresponding to twitter task.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Twitter",
  "verification_engine" : "info",
  "info_details": [{"<string>": "<string>" (or) ["strings"]}],
  "action_reward_amount" : <number>
}
```

#### Quest Type - Daily | ActionType - Social_Discord
- `checkUserJoined` - Checks if a user has joined a server.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Discord",
  "verification_engine" : "checkUserJoined",
  "guild_id" : "<server_id>",
  "action_reward_amount" : <number>
}
```

- `checkUserReacted` - Checks if a user has reacted with a particular emoji on a particular message in a particular channel on a server.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Discord",
  "verification_engine" : "checkUserReacted",
  "guild_id" : "<server_id>",
  "channel_id" : "<channel_id>",
  "message_id" : "<message_id>",
  "emoji" : "<emoji>" ,
  "action_reward_amount" : <number>
}
```

- `checkUserHasRole` - Checks if a user has a particular role in a server.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Discord",
  "verification_engine" : "checkUserHasRole",
  "guild_id" : "<server_id>",
  "role" : "<role>",
  "action_reward_amount" : <number>
}
```
- `checkUserMessage` - Checks if a user has a certain message in a particular channel in a particular server.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Discord",
  "verification_engine" : "checkUserMessage",
  "guild_id" : "<server_id>",
  "channel_id" : "<channel_id>",
  "message" : "<string>",
  "action_reward_amount" : <number>
}
```

- `checkUserInVoice` - Checks if a user has a joined a particular voice channel in a particular server.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Social_Discord",
  "verification_engine" : "checkUserInVoice",
  "guild_id" : "<server_id>",
  "channel_id" : "<channel_id>",
  "action_reward_amount" : <number>
}
```
#### Quest Type - Daily | ActionType - Video
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Video",
  "media_link" : "<video_url>",
  "action_reward_amount" : <number>
}
```
#### Quest Type - Daily | ActionType - Notify
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Notify",
  "notification_type" : "Affiliate / Meme",
  "action_reward_amount" : <number>
}
```

#### Quest Type - Special | ActionType - Generate_Invite_Code
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Generate_Invite_Code",
  "verification_engine" : "generateInviteCode",
  "action_reward_amount" : <number>
}
```

#### Quest Type - Daily | ActionType - Verify_Invite_Code
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Verify_Invite_Code",
  "verification_engine" : "verifyInviteCode",
  "action_reward_amount" : <number>
}
```

#### Quest Type - Daily | ActionType - CheckProfile
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "CheckProfile",
  "verification_engine" : "checkUserProfile",
  "to_check" : [
    "Profile Name",
    "Profile Picture",
    "Connect your Twitter",
    "Connect your Google Account"
  ],
  "action_reward_amount" : <number>
}
```

#### Quest Type - Special | ActionType - BuildProfile

- `updateFullName` - Updates the full name of an authenticated user.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "BuildProfile",
  "verification_engine" : "updateFullName",
  "action_reward_amount" : <number>
}
```
- `updateProfileImage` - Updates the profile image of an authenticated user.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "BuildProfile",
  "verification_engine" : "updateProfileImage",
  "action_reward_amount" : <number>
}
```
- `linkTwitter` - Links the Twitter account of an authenticated user.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "BuildProfile",
  "verification_engine" : "linkTwitter",
  "action_reward_amount" : <number>
}
```
- `linkDiscord` - Links the Discord account of an authenticated user.
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "BuildProfile",
  "verification_engine" : "linkDiscord",
  "action_reward_amount" : <number>
}
```

#### Quest Type - DailyReward | ActionType - Daily_Reward
```
{
  "title" : "<string>",
  "cta_title" : "<string>",
  "type": "Daily_Reward",
  "action_reward_amount" : <number>
}
```

---
## actionGenerateInviteCode (Remove)

Generates an Invite code for an authorized user.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/actionGenerateInviteCode 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/actionGenerateInviteCode' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {}
}'
```
---
## actionVerifyUserInviteCode (Remove)

Verify if user has invited the required invitee.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/actionVerifyUserInviteCode 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/actionVerifyUserInviteCode' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {}
}'
```
---
## registerUserForQuest

Register for a Quest for an underlying organisation by an authorized user.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/registerUserForQuest 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/registerUserForQuest' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "questId": "<quest_id>",
  }
}'
```
---
## completeUserAction

Allows an authorized user to complete an action for a register quest.

> URL : https://capx-gateway-cnfe7xc8.uc.gateway.dev/completeUserAction 

CURL 
```
curl --location --request POST 'https://capx-gateway-cnfe7xc8.uc.gateway.dev/completeUserAction' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
  "data" : {
    "action_order_id": "<action_order_id>",
    <!-- Optional -->
    "email": "<email>", <!-- Incase of `Notify` Action Type -->
    "answer": "<answer>" <!-- Incase of `Quiz` Action Type -->
    "tweet_url": "<tweet_url>" <!-- Incase of `Social_Twitter` Action Type -->
    "name" : "<string>" <!-- Incase of `BuildProfile` Action Type & `updateFullName` engine type.-->
    "image_url" : "<string>" <!-- Incase of `BuildProfile` Action Type & `updateProfileImage` engine type.-->
  }
}'
```