/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {CallableContext} from "firebase-functions/v1/https";
import {OrderStatus} from "../enums/orderStatus";
import {ActionType} from "../enums/actionType";

import {verifyTwitterActions} from "../actions/verifyTwitterActions";
import {updateOrderState} from "../helpers/updateOrderState";
import {verifyDiscordActions} from "../actions/verifyDiscordActions";
import {sendNotification} from "../actions/sendNotification";
import {generateInviteCode} from "../actions/generateInviteCode";
import {checkUserProfile} from "../actions/checkUserProfile";
import {TwitterActionType} from "../enums/twitterActionType";
import {verifyInviteCode} from "../actions/verifyInviteCode";
import {QuestType} from "../enums/questType";
import {updateDailyRewardQuest} from "../helpers/updateDailyRewardQuest";
import {ProfileUpdateType} from "../enums/profileUpdateType";
import {buildUserProfile} from "../actions/buildUserProfile";

export async function completeAction(
    context: CallableContext,
    data: any
) {
  if (!context.auth?.uid) {
    return {success: false, message: "ERROR: Invalid Token"};
  }

  try {
    const db = admin.firestore();
    const questOrderId = data?.action_order_id.split("-")[0];
    const _currentQuestId = questOrderId.split("|")[0];
    const _orgId = _currentQuestId.split("_")[0];
    // Check what kind of Quest is this.
    const fetchQuestOrder = await db.collection("quest_order").doc(questOrderId).get();
    if (fetchQuestOrder.exists) {
      const dataQuestOrder: any = fetchQuestOrder.data();
      if (dataQuestOrder?.quest_type == QuestType.DailyReward) {
        // Check if user is doing the action for first time.
        const _actionOrder = await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).get();
        if (_actionOrder.exists) {
          const actionOrder: any = _actionOrder.data();
          if (actionOrder.action_order_status == OrderStatus.COMPLETED) {
            return {success: false, message: "ERROR: You have completed the Quest!"};
          } else if (actionOrder.action_order_status == OrderStatus.IN_PROGRESS) {
            // Check if the user is eligible to claim the reward.
            const lastRewardClaimedAt = Number(actionOrder.last_claimed_at); // This is normalised to the 00:00 of the corresponding day.
            const currentTime = Math.floor(Math.ceil(new Date().getTime() / 1000) / 86400) * 86400;
            if (currentTime - lastRewardClaimedAt < 86400) {
              return {success: false, message: "ERROR: Cannot claim twice in a single day"};
            }
          }
          // Claim the reward.
          const _user = await db.collection("users").doc(context.auth?.uid).get();
          if (_user.exists) {
            const user: any = _user.data();
            const _currentActionId = Number(data?.action_order_id.split("-")[1]);
            const _currentQuestId = questOrderId.split("|")[0];
            const actionInst = await db.collection("orgs").doc(actionOrder?.org_id).collection("quests").doc(_currentQuestId).collection("actions").doc(_currentActionId.toString()).get();
            if (actionInst.exists) {
              const action = actionInst.data();
              const updateStatus = await updateDailyRewardQuest(
                  user,
                  action,
                  actionOrder,
                  context?.auth.uid,
                  data?.action_order_id,
                  questOrderId,
              );
              if (updateStatus) {
                return {success: true, message: "SUCCESS: Action Completed Successfully!"};
              }
              return {success: false, message: "ERROR: Verification Failed!"};
            }
            return {success: false, message: "ERROR: Invalid Quest action!"};
          }
          return {success: false, message: "ERROR: User Doesn't Exist!"};
        }
        return {success: false, message: "ERROR: User not Registered for the Quest!"};
      } else {
        if (dataQuestOrder?.quest_type == QuestType.Special) {
          const _currentTime = Math.ceil(new Date().getTime() / 1000);
          const isValidQuest = await db.collection("orgs").doc(_orgId).collection("quests").doc(_currentQuestId).get();
          if (isValidQuest.exists) {
            const isValidQuestData: any = isValidQuest.data();
            if (isValidQuestData.start_date > _currentTime) {
              return {success: false, message: "ERROR: Quest NOT started yet."};
            } else if (isValidQuestData.expiry < _currentTime) {
              return {success: false, message: "ERROR: Quest has ENDED."};
            }
          } else {
            return {success: false, message: "ERROR: Unable to Process Request!"};
          }
        }
        // Check if user has already completed the task.
        const _actionOrder = await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).get();
        if (_actionOrder.exists) {
          const actionOrder: any = _actionOrder.data();
          if (actionOrder.action_order_status == OrderStatus.PENDING) {
            // Determine the action type and do the needful.
            // 1. Fetch current action ID
            const _currentActionId = Number(data?.action_order_id.split("-")[1]);
            // 2. Check if this is the first task
            if (_currentActionId != 1) {
              const _prevActionOrderId = data?.action_order_id.split("-")[0] + "-" + (_currentActionId-1).toString();
              console.log("_prevActionOrder", _prevActionOrderId);
              const _prevActionOrder = await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(_prevActionOrderId).get();
              if (_prevActionOrder.exists) {
                const prevActionOrder = _prevActionOrder.data();
                if (prevActionOrder?.action_order_status == OrderStatus.PENDING) {
                  return {success: false, message: "ERROR: Please complete previous task!"};
                }
              } else {
                return {success: false, message: "ERROR: Invalid Action!"};
              }
            }
            console.log("OrgID", actionOrder?.org_id);
            console.log("QuestID", _currentQuestId);
            console.log("ActionId", _currentActionId.toString());
            const actionInst = await db.collection("orgs").doc(actionOrder?.org_id).collection("quests").doc(_currentQuestId).collection("actions").doc(_currentActionId.toString()).get();
            if (actionInst.exists) {
              const action = actionInst.data();
              if (action?.type == ActionType.Quiz) {
                // Quiz Task Validation
                if (data?.answer) {
                  if (data?.answer == action?.answer) {
                    const _user = await db.collection("users").doc(context?.auth?.uid).get();
                    if (_user.exists) {
                      const user: any = _user.data();
                      const updateStatus = await updateOrderState(
                          user,
                          data,
                          action,
                          actionOrder,
                          context?.auth.uid,
                          _currentActionId,
                          questOrderId,
                      );
                      if (updateStatus) {
                        return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                      }
                      return {success: false, message: "ERROR: Verification Failed!"};
                    }
                    return {success: false, message: "ERROR: User Doesn't Exist!"};
                  }
                  return {success: false, message: "ERROR: Wrong answer!"};
                }
                return {success: false, message: "ERROR: Missing `answer` parameter!"};
              } else if (action?.type == ActionType.Notify) {
                // Check if time has elapsed
                // if ( Math.ceil(new Date().getTime() / 1000) < action.start_date) {
                //   return {success: false, message: "ERROR: Cannot complete before time!"};
                // }
                // Notify type validation
                if (data?.email) {
                  const _user = await db.collection("users").doc(context?.auth?.uid).get();
                  if (_user.exists) {
                    const user: any = _user.data();
                    const result = await sendNotification(action, data?.email);
                    if (result) {
                      const updateStatus = await updateOrderState(
                          user,
                          data,
                          action,
                          actionOrder,
                          context?.auth.uid,
                          _currentActionId,
                          questOrderId,
                      );
                      if (updateStatus) {
                        return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                      }
                      return {success: false, message: "ERROR: Unable to process request!"};
                    }
                  }
                  return {success: false, message: "ERROR: User Doesn't Exist!"};
                }
                return {success: false, message: "ERROR: Missing `email` parameter!"};
              } else if (action?.type == ActionType.SocialTwitter) {
                const _user = await db.collection("users").doc(context?.auth?.uid).get();
                if (_user.exists) {
                  const user: any = _user.data();
                  const twitterId = user?.socials.twitter_id;
                  let _tweetURl = "";
                  if (action.verification_engine == TwitterActionType.UserTweet) {
                    if (data?.tweet_url) {
                      if (data?.tweet_url == "") {
                        return {success: false, message: "ERROR: Invalid parameter value `tweet_url`"};
                      }
                    } else {
                      return {success: false, message: "ERROR: Missing parameter `tweet_url`"};
                    }
                    _tweetURl = data.tweet_url;
                  }
                  const result = await verifyTwitterActions(action, twitterId, _tweetURl);
                  if (result) {
                    const updateStatus = await updateOrderState(
                        user,
                        data,
                        action,
                        actionOrder,
                        context?.auth.uid,
                        _currentActionId,
                        questOrderId,
                    );
                    if (updateStatus) {
                      return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                    }
                    return {success: false, message: "ERROR: Unable to process request!"};
                  }
                  return {success: false, message: "ERROR: Task verification failed!"};
                }
                return {success: false, message: "ERROR: User Doesn't Exist!"};
              } else if (action?.type == ActionType.SocialDiscord) {
                const _user = await db.collection("users").doc(context?.auth?.uid).get();
                if (_user.exists) {
                  const user = _user.data();
                  const result = await verifyDiscordActions(context, action, user?.socials.discord_username);
                  if (result) {
                    const updateStatus = await updateOrderState(
                        user,
                        data,
                        action,
                        actionOrder,
                        context?.auth.uid,
                        _currentActionId,
                        questOrderId,
                    );
                    if (updateStatus) {
                      return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                    }
                    return {success: false, message: "ERROR: Unable to process request!"};
                  }
                  return {success: false, message: "ERROR: Task verification failed!"};
                }
                return {success: false, message: "ERROR: User Doesn't Exist!"};
              } else if (action?.type == ActionType.GenerateInviteCode) {
                const _user = await db.collection("users").doc(context?.auth?.uid).get();
                if (_user.exists) {
                  const user = _user.data();
                  const result = await generateInviteCode(context, data);
                  if (result.success) {
                    const updateStatus = await updateOrderState(
                        user,
                        data,
                        action,
                        actionOrder,
                        context?.auth.uid,
                        _currentActionId,
                        questOrderId,
                    );
                    if (updateStatus) {
                      return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                    }
                    return {success: false, message: "ERROR: Unable to process request!"};
                  }
                  return {success: false, message: "ERROR: Task verification failed!"};
                }
                return {success: false, message: "ERROR: User Doesn't Exist!"};
              } else if (action?.type == ActionType.VerifyInviteCode) {
                const _user = await db.collection("users").doc(context?.auth?.uid).get();
                if (_user.exists) {
                  const user = _user.data();
                  const result = await verifyInviteCode(context);
                  if (result.success) {
                    const updateStatus = await updateOrderState(
                        user,
                        data,
                        action,
                        actionOrder,
                        context?.auth.uid,
                        _currentActionId,
                        questOrderId,
                    );
                    if (updateStatus) {
                      return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                    }
                    return {success: false, message: "ERROR: Unable to process request!"};
                  }
                  return {success: false, message: "ERROR: Task verification failed!"};
                }
                return {success: false, message: "ERROR: User Doesn't Exist!"};
              } else if (action?.type == ActionType.CheckProfile) {
                const _user = await db.collection("users").doc(context?.auth?.uid).get();
                if (_user.exists) {
                  const user = _user.data();
                  const result = await checkUserProfile(context);
                  if (result) {
                    const updateStatus = await updateOrderState(
                        user,
                        data,
                        action,
                        actionOrder,
                        context?.auth.uid,
                        _currentActionId,
                        questOrderId,
                    );
                    if (updateStatus) {
                      return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                    }
                    return {success: false, message: "ERROR: Unable to process request!"};
                  }
                  return {success: false, message: "ERROR: Task verification failed!"};
                }
                return {success: false, message: "ERROR: User Doesn't Exist!"};
              } else if (action?.type == ActionType.BuildProfile) {
                const _user = await db.collection("users").doc(context?.auth?.uid).get();
                if (_user.exists) {
                  const user = _user.data();
                  const buildProfileData: any = {};
                  if (action.verification_engine == ProfileUpdateType.FullName) {
                    if (data?.name) {
                      if (data?.name.trim() === "") {
                        return {success: false, message: "ERROR: Invalid parameter value `name`"};
                      }
                    } else {
                      return {success: false, message: "ERROR: Missing parameter `tweet_url`"};
                    }
                    buildProfileData["name"] = data?.name.trim();
                  } else if (action.verification_engine == ProfileUpdateType.ProfileImage) {
                    if (data?.image_url) {
                      if (data?.image_url.trim() === "") {
                        return {success: false, message: "ERROR: Invalid parameter value `image_url`"};
                      }
                    } else {
                      return {success: false, message: "ERROR: Invalid parameter value `image_url`"};
                    }
                    buildProfileData["image_url"] = data?.image_url.trim();
                  } else if (action.verification_engine == ProfileUpdateType.LinkTwitter) {
                    if (data?.twitter_token) {
                      if (data?.twitter_token.trim() === "") {
                        return {success: false, message: "ERROR: Invalid parameter value `twitter_token`"};
                      }
                    } else {
                      return {success: false, message: "ERROR: Invalid parameter value `twitter_token`"};
                    }
                    buildProfileData["twitter_token"] = data?.twitter_token.trim();
                  } else if (action.verification_engine == ProfileUpdateType.LinkDiscord) {
                    if (data?.discord) {
                      if (data?.discord.trim() === "") {
                        return {success: false, message: "ERROR: Invalid parameter value `discord`"};
                      }
                    } else {
                      return {success: false, message: "ERROR: Invalid parameter value `discord`"};
                    }
                    buildProfileData["discord"] = data?.discord.trim();
                  }
                  const result = await buildUserProfile(action, context, buildProfileData);
                  if (result.success) {
                    const updateStatus = await updateOrderState(
                        user,
                        data,
                        action,
                        actionOrder,
                        context?.auth.uid,
                        _currentActionId,
                        questOrderId,
                    );
                    if (updateStatus) {
                      return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                    }
                    return {success: false, message: "ERROR: Unable to process request!"};
                  }
                  return {success: false, message: "ERROR: Task verification failed!"};
                }
                return {success: false, message: "ERROR: User Doesn't Exist!"};
              } else {
                const _user = await db.collection("users").doc(context?.auth?.uid).get();
                if (_user.exists) {
                  const user = _user.data();
                  const updateStatus = await updateOrderState(
                      user,
                      data,
                      action,
                      actionOrder,
                      context?.auth.uid,
                      _currentActionId,
                      questOrderId,
                  );
                  if (updateStatus) {
                    return {success: true, message: "SUCCESS: Action Completed Successfully!"};
                  }
                  return {success: false, message: "ERROR: Unable to process request!"};
                }
                return {success: false, message: "ERROR: User Doesn't Exist!"};
              }
            }
            return {success: false, message: "ERROR: Invalid Quest action!"};
          }
          return {success: false, message: "ERROR: User already completed the task!"};
        }
        return {success: false, message: "ERROR: User not Registered for the Quest!"};
      }
    }
    return {success: false, message: "ERROR: User not Registered for the Quest!"};
  } catch (err) {
    console.error(err);
    return {success: false, message: "ERROR!"};
  }
}
