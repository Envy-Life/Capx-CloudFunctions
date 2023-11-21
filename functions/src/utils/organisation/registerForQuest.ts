/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";
import {CallableContext} from "firebase-functions/v1/https";
import {OrderStatus} from "../enums/orderStatus";
import {StatusType} from "../enums/statusType";
import {ActionType} from "../enums/actionType";
import {QuestType} from "../enums/questType";

export async function registerForQuest(
    context: CallableContext,
    data: any
) {
  if (!context.auth?.uid) {
    return {success: false, message: "ERROR: Invalid Token"};
  }

  try {
    const db = admin.firestore();
    const _currentTime = Math.ceil(new Date().getTime() / 1000);
    // Check if the quest exists
    const orgId = data?.questId.split("_")[0];
    const _quest = await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).get();
    if (_quest.exists) {
      const quest: any = _quest.data();
      console.log(quest.quest_type);
      console.log(quest.quest_type === QuestType.Special);
      console.log(quest.quest_type == QuestType.Special);
      if (quest.quest_type == QuestType.Special) {
        // Check if the current time is between start_time and end_time.
        if (quest.start_date > _currentTime) {
          return {success: false, message: "ERROR: Quest NOT started yet."};
        } else if (quest.expiry < _currentTime) {
          return {success: false, message: "ERROR: Quest has ENDED."};
        }
      }
      // Check if quest has start date
      // if (quest.start_date) {
      //   try {
      //     if (quest.start_date < Math.ceil(new Date().getTime() / 1000)) {
      //       return {success: false, message: "ERROR: Cannot Register before time!"};
      //     }
      //   } catch (err) {
      //     console.error(err);
      //     return {success: false, message: "ERROR: Cannot Register before time!"};
      //   }
      // }
      const _user = await db.collection("users").doc(context?.auth.uid).get();
      if (!_user.exists) {
        return {success: false, message: "ERROR: User doesn't exist!"};
      }
      // Get the user data
      const user: any = _user.data();

      // Check if user is allowed to register for the quest.
      const _userRegistrationTime = user.registered_on;
      const _requiredDiff = Number(quest.quest_day.split("DAY")[1]) * 86400;

      const _timeDiff = _currentTime - _userRegistrationTime;
      if (_requiredDiff < _timeDiff) {
        return {success: false, message: "ERROR: Cannot register early for an quest!"};
      }

      const questOrderId = data?.questId + "|" + context?.auth.uid;

      // Create ActionObj
      const _actionObj: any = {};
      const _actionIds = [];
      for (let i = 0; i < quest?.actions.length; i++) {
        const _action = quest?.actions[i];
        _actionIds.push(_action.action_id);
        const _actionOrderId = questOrderId + "-" + _action.action_id.toString();
        _actionObj[questOrderId + "-" + _action.action_id] = {
          action_title: _action.title,
          action_order_type: _action.type,
          action_order_status: OrderStatus.PENDING,
          action_id: _action.action_id,
          action_order_id: _actionOrderId,
        };
      }

      // Check if user has already registered for the quest.
      const _isRegistered = await db.collection("quest_order").doc(`${questOrderId}`).get();
      if (!_isRegistered.exists) {
        const questOrderData = {
          docType: "Individual",
          org_id: orgId,
          quest_id: data?.questId,
          quest_order_id: questOrderId,
          quest_type: quest?.quest_type,
          quest_title: quest?.title,
          quest_start_date: Math.ceil(new Date().getTime() / 1000),
          quest_end_date: "",
          quest_description: quest?.description,
          rewards_type: quest?.rewards_type,
          max_rewards: Number(quest?.max_rewards),
          points_rewarded: Number(0),
          user_id: context.auth?.uid,
          status: StatusType.REGISTERED,
          actions: _actionObj,
        };

        const _questOrder = db.collection("quest_order").doc(questOrderId);
        const _questOrderRes = await _questOrder.set(questOrderData);
        if (_questOrderRes) {
          "";
          // Create Action objects
          let _createdInstances = 0;
          for (let i=0; i < _actionIds.length; i++) {
            console.log("OrgId", orgId);
            console.log("QuestId", data?.questId);
            console.log("Action Id", _actionIds[i]);
            const _actionRecord = await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).collection("actions").doc(_actionIds[i].toString()).get();
            if (_actionRecord.exists) {
              console.log("Action Id", _actionIds[i]);
              const actionRecord = _actionRecord.data();
              const _actionOrderId = questOrderId + "-" + _actionIds[i].toString();
              const _actionObj: any = {
                docType: "Individual",
                org_id: orgId,
                quest_order_id: questOrderId,
                action_id: Number(_actionIds[i]),
                action_order_title: actionRecord?.title,
                action_order_type: actionRecord?.type,
                action_order_cta: actionRecord?.cta_title,
                user_id: context?.auth.uid,
                action_order_status: OrderStatus.PENDING,
                action_order_id: _actionOrderId,
              };

              if (quest?.quest_type == QuestType.DailyReward) {
                _actionObj["last_claimed_at"] = Number(0);
              }
              if (actionRecord?.type == ActionType.Quiz) {
                _actionObj["action_order_details"] = {
                  question: actionRecord.question,
                  options: actionRecord.options,
                };
              } else if (actionRecord?.type == ActionType.Video) {
                _actionObj["action_order_details"] = {
                  media_link: actionRecord.media_link,
                };
              }
              const _actionOrder = db.collection("quest_order").doc(questOrderId).collection("action_order").doc(_actionOrderId);
              const _actionOrderResp = await _actionOrder.create(_actionObj);
              if (_actionOrderResp) {
                _createdInstances += 1;
              } else {
                if (i > 0) {
                  for (let j=0; j < i; j++) {
                    await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(questOrderId + "-" + _actionIds[j].toString()).delete();
                  }
                  break;
                }
              }
            }
          }

          // Check If all action Document is created.
          if (_createdInstances == _actionIds.length) {
            // Update user_id & user_count in quests_collection
            const _quests = await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).get();
            if (_quests.exists) {
              const _oldQuestData: any = _quests.data();
              const _updateQuestRes = await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).update(
                  {
                    "user_count": Number(_oldQuestData?.user_count) + 1,
                    "user_ids": FieldValue.arrayUnion(context?.auth?.uid),
                  }
              );
              if (_updateQuestRes) {
                // Update user_id & user_count in actions sub-collection
                let _actionsUpdateCount = 0;
                for (let i = 0; i < _actionIds.length; i++) {
                  const _action = await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).collection("actions").doc(_actionIds[i].toString()).update(
                      {
                        "user_count": FieldValue.increment(1),
                        "user_ids": FieldValue.arrayUnion(context?.auth?.uid),
                      }
                  );
                  if (_action) {
                    _actionsUpdateCount += 1;
                  } else {
                    if (i > 0) {
                      for (let j=0; j < i; j++) {
                        await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).collection("actions").doc(_actionIds[j].toString()).update(
                            {
                              "user_count": FieldValue.increment(-1),
                              "user_ids": FieldValue.arrayRemove(context?.auth?.uid),
                            }
                        );
                      }
                      break;
                    }
                  }
                }

                // Check if all actions are updated.
                if (_actionsUpdateCount != _actionIds.length) {
                  await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).update(_oldQuestData);
                  for (let j=0; j < _actionIds.length; j++) {
                    await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(questOrderId + "-" + _actionIds[j].toString()).delete();
                  }
                  await _questOrder.delete();
                  return {success: false, message: "ERROR: Unable to Register!"};
                }
                // Update quest object in users-quests collection
                const _aggId = Number(Math.floor(Number(user?.quests_registered)/20).toFixed(0)) + 1;

                // Check if the aggregateDocument exists
                const _userOrderAgg = await db.collection("users").doc(context?.auth.uid).collection("quest-order").doc(_aggId.toString()).get();
                if (_userOrderAgg.exists) {
                  const _oldUserOrderAggData: any = _userOrderAgg.data();

                  const temp: any = {};
                  temp[`quests.${questOrderId}`] = {
                    title: quest?.title,
                    quest_type: quest?.quest_type,
                    reward_type: quest?.rewards_type,
                    max_rewards: Number(quest?.max_rewards),
                    status: StatusType.REGISTERED,
                    start_time_date: Math.ceil(new Date().getTime() / 1000),
                  };
                  const res = await db.collection("users").doc(context?.auth.uid).collection("quest-order").doc(_aggId.toString()).update(
                      temp
                  );
                  if (res) {
                    // Update Quests count
                    const res = await db.collection("users").doc(context?.auth.uid).update(
                        {
                          "quests_registered": Number(user?.quests_registered)+1,
                        }
                    );
                    if (res) {
                      return {success: true, message: "SUCCESS!", quest_order_id: questOrderId, quest_status: StatusType.REGISTERED};
                    } else {
                      await db.collection("users").doc(context?.auth.uid).update(user);
                      await db.collection("users").doc(context?.auth.uid).collection("quest-order").doc(_aggId.toString()).update(_oldUserOrderAggData);
                      await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).update(_oldQuestData);
                      for (let j=0; j < _actionIds.length; j++) {
                        await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(questOrderId + "-" + _actionIds[j].toString()).delete();
                      }
                      await _questOrder.delete();
                      return {success: false, message: "ERROR: Unable to Register!"};
                    }
                  } else {
                    await db.collection("users").doc(context?.auth.uid).collection("quest-order").doc(_aggId.toString()).update(_oldUserOrderAggData);
                    await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).update(_oldQuestData);
                    for (let j=0; j < _actionIds.length; j++) {
                      await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(questOrderId + "-" + _actionIds[j].toString()).delete();
                    }
                    await _questOrder.delete();
                    return {success: false, message: "ERROR: Unable to Register!"};
                  }
                } else {
                  const temp: any = {};
                  temp[`${questOrderId}`] = {
                    title: quest.title,
                    quest_type: quest?.quest_type,
                    reward_type: quest.rewards_type,
                    max_rewards: Number(quest.max_rewards),
                    status: StatusType.REGISTERED,
                    start_time_date: Math.ceil(new Date().getTime() / 1000),
                  };
                  const userOrderAgg = db.collection("users").doc(context?.auth.uid).collection("quest-order").doc(_aggId.toString());
                  const userOrderAggRes = await userOrderAgg.set(
                      {
                        docType: "Aggregate",
                        quests: temp,
                      }
                  );
                  if (userOrderAggRes) {
                    // Update Quests count
                    const res = await db.collection("users").doc(context?.auth.uid).update(
                        {
                          "quests_registered": Number(user?.quests_registered)+1,
                        }
                    );
                    if (res) {
                      return {success: true, message: "SUCCESS!", quest_order_id: questOrderId, quest_status: StatusType.REGISTERED};
                    } else {
                      await db.collection("users").doc(context?.auth.uid).update(user);
                      await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).update(_oldQuestData);
                      for (let j=0; j < _actionIds.length; j++) {
                        await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(questOrderId + "-" + _actionIds[j].toString()).delete();
                      }
                      await _questOrder.delete();
                      return {success: false, message: "ERROR: Unable to Register!"};
                    }
                  } else {
                    await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).update(_oldQuestData);
                    for (let j=0; j < _actionIds.length; j++) {
                      await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(questOrderId + "-" + _actionIds[j].toString()).delete();
                    }
                    await _questOrder.delete();
                    return {success: false, message: "ERROR: Unable to Register!"};
                  }
                }
              } else {
                await db.collection("orgs").doc(orgId).collection("quests").doc(data?.questId).update(_oldQuestData);
                for (let j=0; j < _actionIds.length; j++) {
                  await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(questOrderId + "-" + _actionIds[j].toString()).delete();
                }
                await _questOrder.delete();
                return {success: false, message: "ERROR: Unable to Register!"};
              }
            } else {
              for (let j=0; j < _actionIds.length; j++) {
                await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(questOrderId + "-" + _actionIds[j].toString()).delete();
              }
              await _questOrder.delete();
              return {success: false, message: "ERROR: Unable to Register!"};
            }
          } else {
            await _questOrder.delete();
            return {success: false, message: "ERROR: Unable to Register!"};
          }
        }
        return {success: false, message: "ERROR: Registering for Quest!"};
      }
      const __isRegistered: any = _isRegistered.data();
      return {
        success: false,
        message: "ERROR: User already Registered!",
        quest_order_id: questOrderId,
        quest_status: __isRegistered.status,
      };
    }
    return {
      success: false,
      message: "ERROR: No Quest Found!"};
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR!",
    };
  }
}
