# Capx Discord Bot
The Bot is a silent observing bot which can verify if discord related tasks are completed. It needs to be present in the respective server for the verification to work.

## Checks
The bot can check for the following things:

### checkUserJoined
Checks if a user joined the server.

#### Parameters
* `guildId` - The id of the server the user should be in.
* `username` - The username of the user to check.

```curl
curl -X GET -G \
  <serverLink>/checkUserJoined \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  --data-urlencode 'guildId=1044564181262798880'
  --data-urlencode 'username=example#1234'
```

### checkUserReacted
Checks if a user reacted to a message.

#### Parameters
* `username` - username of the user check.
* `guildId` - The id of the server the user should be in.
* `channelId` - The id of the channel the message is in.
* `messageId` - The id of the message the user should have reacted to.
* `emoji` - The emoji the user should have reacted with.

```curl
curl -X GET -G \
  <serverLink>/checkUserReacted \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  --data-urlencode 'username=example#1234'
  --data-urlencode 'guildId=1044564181262798880'
  --data-urlencode 'channelId=1044564181980020759'
  --data-urlencode 'messageId=1045047081259245588'
  --data-urlencode 'emoji=🤣'
```

### checkUserHasRole
Checks if a user has a role.

#### Parameters
* `username` - username of the user check.
* `guildId` - The id of the server the user should be in.
* `role` - The name of the role the user should have.

```curl
curl -X GET -G \
  <serverLink>/checkUserHasRole \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  --data-urlencode 'username=example#1234'
  --data-urlencode 'guildId=1044564181262798880'
  --data-urlencode 'role=example role'
```

### checkUserMessage
Checks if a user sent a message.

#### Parameters
* `username` - username of the user check.
* `guildId` - The id of the server the user should be in.
* `message` - The part of message the user should have sent.

```curl
curl -X GET -G \
  <serverLink>/checkUserMessage \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  --data-urlencode 'username=example#1234'
  --data-urlencode 'guildId=1044564181262798880'
  --data-urlencode 'message=hi'
```

### checkUserInVoice
Checks if a user is in a voice channel.

#### Parameters
* `username` - username of the user check.
* `guildId` - The id of the server the user should be in.
* `channelId` - The id of the channel the user should be in.

```curl
curl -X GET -G \
  <serverLink>/checkUserInVoice \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  --data-urlencode 'username=example#1234'
  --data-urlencode 'guildId=1044564181262798880'
  --data-urlencode 'channelId=1044564181980020759'
```

### checkUserSubscribedToEvent
Checks if a user is subscribed to an event.

#### Parameters
* `username` - username of the user check.
* `guildId` - The id of the server the user should be in.
* `eventId` - The id of the event the user should be subscribed to.

```curl
curl -X GET -G \
  <serverLink>/checkUserSubscribedToEvent \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  --data-urlencode 'username=example#1234'
  --data-urlencode 'guildId=1044564181262798880'
  --data-urlencode 'eventId=1052879630425657395'
```

### checkUserAttendedEvent
Checks if a user attended an event. (returns `true` even if the user didn't attend the event for its full duration)

#### Parameters
* `username` - username of the user check.
* `guildId` - The id of the server the user should be in.
* `eventId` - The id of the event the user should have attended.

```curl
curl -X GET -G \
  <serverLink>/checkUserAttendedEvent \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  --data-urlencode 'username=example#1234'
  --data-urlencode 'guildId=1044564181262798880'
  --data-urlencode 'eventId=1052879630425657395'
```
