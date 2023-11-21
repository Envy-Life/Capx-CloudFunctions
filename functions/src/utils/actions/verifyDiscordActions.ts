/* eslint-disable max-len */
import axios from "axios";
import * as secrets from "../../secrets.json";
import {CallableContext} from "firebase-functions/v1/https";
import {DiscordActionType} from "../enums/discordActionType";

export async function verifyDiscordActions(
    context : CallableContext,
    action : any,
    discordUsername: string
) {
  try {
    const data: any = {
      guildId: action?.guild_id,
      username: discordUsername,
    };
    const FIREBASE_TOKEN = context.rawRequest.rawHeaders[context.rawRequest.rawHeaders.findIndex((element : string) => element === "authorization") + 1];

    if (action?.verification_engine == DiscordActionType.UserHasReacted) {
      data["channelId"] = action?.channel_id;
      data["messageId"] = action?.message_id;
      data["emoji"] = action?.emoji;
    } else if (action?.verification_engine == DiscordActionType.UserHasRole) {
      data["role"] = action?.role;
    } else if (action?.verification_engine == DiscordActionType.UserHasMessaged) {
      data["channelId"] = action?.channel_id;
      data["message"] = action?.message;
    } else if (action?.verification_engine == DiscordActionType.UserInVoiceChannel) {
      data["channelId"] = action?.channel_id;
    } else if (action?.verification_engine == DiscordActionType.UserSubscribedEvent) {
      data["eventId"] = action?.event_id;
    }
    const response = await axios.get(
        secrets.DISCORD_BASE_URL + action.verification_engine,
        {
          params: data,
          headers: {
            "Authorization": FIREBASE_TOKEN,
          },
        }
    );
    return response.data;
  } catch (err) {
    console.log(err);
    return false;
  }
}

