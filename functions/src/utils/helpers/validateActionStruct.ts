/* eslint-disable max-len */
import {ActionType} from "../enums/actionType";
import {DiscordActionType} from "../enums/discordActionType";
import {NotifyType} from "../enums/notifyType";
import {ProfileUpdateType} from "../enums/profileUpdateType";
import {TwitterActionType} from "../enums/twitterActionType";

export function validateActionStruct(
    action: any
) {
  try {
    if (
      action.title?.length != 0 &&
          action.type?.length != 0 &&
          action.cta_title?.length != 0
    ) {
      if ((Object.values(ActionType).includes(action.type))) {
        if (action.type == ActionType.Quiz) {
          if (
            action.question?.length == 0 &&
                      action.answer?.length == 0 &&
                      action.options?.length == 0
          ) {
            console.log(action.question?.length, action.answer?.length, action.options?.length);
            return false;
          }
        } else if (action.type == ActionType.SocialTwitter) {
          if ((Object.values(TwitterActionType).includes(action.verification_engine))) {
            if (action.verification_engine == TwitterActionType.UserFollows) {
              if (action.twitter_id_to_follow.length == 0) {
                return false;
              }
            } else if (
              action.verification_engine == TwitterActionType.UserCommented ||
                action.verification_engine == TwitterActionType.UserLikedTweet ||
                action.verification_engine == TwitterActionType.UserQuoted ||
                action.verification_engine == TwitterActionType.UserRetweeted
            ) {
              if (action.tweet_url.length == 0) {
                return false;
              }
            } else if (
              action.verification_engine == TwitterActionType.UserTweet
            ) {
              if (action.tweet_strings.length == 0) {
                return false;
              }
            } else if (
              action.verification_engine == TwitterActionType.TwitterInfo
            ) {
              if (Object.values(action.info_details).length == 0) {
                return false;
              }
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.SocialDiscord) {
          if ((Object.values(DiscordActionType).includes(action.verification_engine))) {
            if (action.guild_id.length == 0) {
              return false;
            }
            if (action.verification_engine == DiscordActionType.UserHasReacted) {
              if (action.channel_id.length == 0 && action.message_id.length == 0 && action.emoji.length == 0) {
                return false;
              }
            } else if (action.verification_engine == DiscordActionType.UserHasRole) {
              if (action.role.length == 0) {
                return false;
              }
            } else if (action.verification_engine == DiscordActionType.UserHasMessaged) {
              if (action.channel_id.length == 0 && action.message.length == 0) {
                return false;
              }
            } else if (action.verification_engine == DiscordActionType.UserInVoiceChannel) {
              if (action.channel_id.length == 0) {
                return false;
              }
            } else if (action.verification_engine == DiscordActionType.UserSubscribedEvent) {
              if (action.event_id.length == 0) {
                return false;
              }
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.Video) {
          if (
            action.media_link?.length == 0
          ) {
            console.log(action.media_link?.length);
            return false;
          }
        } else if (action.type == ActionType.Notify) {
          if (action.notification_type) {
            if ((Object.values(NotifyType).includes(action.notification_type))) {
              if (action.notification_type.length == 0) {
                return false;
              }
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.GenerateInviteCode) {
          if (action.verification_engine) {
            if (action.verification_engine != "generateInviteCode") {
              return false;
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.CheckProfile) {
          if (action.verification_engine && action.to_check) {
            if (action.verification_engine != "checkUserProfile" && action.to_check.length == 0) {
              return false;
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.BuildProfile) {
          if (action.verification_engine) {
            if (!(Object.values(ProfileUpdateType).includes(action.verification_engine))) {
              return false;
            }
          } else {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}
