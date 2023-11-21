/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {ActionType} from "../enums/actionType";
import {OrderStatus} from "../enums/orderStatus";
import {StatusType} from "../enums/statusType";
import {claimInviterReward} from "./claimInviterReward";
import {FieldValue} from "firebase-admin/firestore";

export async function updateOrderState(
    user: any,
    data: any,
    action: any,
    actionOrder: any,
    userId: string,
    currentActionId: number,
    questOrderId: string,
) {
  try {
    const db = admin.firestore();

    // 1. Update Action Order state to success.
    const actionObjectTemp: any = {};
    actionObjectTemp["action_order_status"] = OrderStatus.COMPLETED;
    if (action?.type == ActionType.Notify) {
      actionObjectTemp["action_notifiying_email"] = data?.email;
    }
    const updateActionOrder = await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(
        actionObjectTemp
    );
    if (updateActionOrder) {
      // 2. Update Quest Order state "points_rewarded"
      // 3. Update Quest Order -> `actions` -> `action_order_id` status
      // 4. Update Quest Order -> `status` -> `action_order_id` status
      const questInst = await db.collection("quest_order").doc(questOrderId).get();
      if (questInst.exists) {
        const questData: any = questInst.data();
        // All tasks are complete.
        const _temp: any = {};
        _temp[`actions.${data?.action_order_id}.action_order_status`] = OrderStatus.COMPLETED;
        // Check if points_rewarded elapses max_reward_amount
        if (Number(questData?.points_rewarded) + Number(action?.reward_amount) > Number(questData?.max_rewards) ) {
          await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
          return false;
        }
        _temp["points_rewarded"] = Number(questData?.points_rewarded) + Number(action?.reward_amount);
        _temp["status"] = StatusType.IN_PROGRESS;
        if (Object.keys(questData.actions).length == currentActionId) {
          _temp["status"] = StatusType.COMPLETED;
          _temp["quest_end_date"] = Math.ceil(new Date().getTime() / 1000);
        }
        const updateQuestObject = await db.collection("quest_order").doc(questOrderId).update(
            _temp
        );
        if (updateQuestObject) {
          // 4. Update `earned_rewards` in the User collection
          const _userTemp: any = {};
          _userTemp["earned_rewards"] = FieldValue.increment(Number(action?.reward_amount));
          if (Object.keys(questData.actions).length == currentActionId) {
            _userTemp["quests_completed"] = FieldValue.increment(1);
          }
          const userUpdate = await db.collection("users").doc(userId).update(
              _userTemp
          );
          if (userUpdate) {
            // 4.1 Update `earned_rewards` in the user public collection.
            const _userPublicUpdate = await db.collection("users").doc(userId).collection("public").doc("public").update(_userTemp);
            if (_userPublicUpdate) {
              // 5. Update user-quest-order data.
              const _aggId = Number(Math.floor(Number(user?.quests_registered)/20).toFixed(0)) + 1;
              // Check if the aggregateDocument exists
              const _userOrderAgg = await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).get();
              if (_userOrderAgg.exists) {
                const _oldUserOrderAggData: any = _userOrderAgg.data();
                const _newUserOrderAggData: any = {};
                _newUserOrderAggData[`quests.${questOrderId}.status`] = StatusType.IN_PROGRESS;
                if (Object.keys(questData.actions).length == currentActionId) {
                  _newUserOrderAggData[`quests.${questOrderId}.status`] = StatusType.COMPLETED;
                  _newUserOrderAggData[`quests.${questOrderId}.end_date`] = Math.ceil(new Date().getTime() / 1000);
                }
                const _updateUserOrderAgg = await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_newUserOrderAggData);
                if (_updateUserOrderAgg) {
                  // 6. Check for bonus Inviter Reward
                  if (Number(user?.earned_rewards) + Number(action?.reward_amount) >= 20) {
                    const _claimStatus = await claimInviterReward(userId, user?.inviter_id);
                    if (_claimStatus) {
                      // Update Quest Data & Quest Aggregate Data if quest completed.
                      if (Object.keys(questData.actions).length == currentActionId) {
                        const questId = questOrderId.split("|")[0];
                        const orgId = questId.split("_")[0];
                        const questInst = await db.collection("orgs").doc(orgId).collection("quests").doc(questId).update(
                            {
                              "completed_by": FieldValue.increment(1),
                            }
                        );
                        if (questInst) {
                          // Update Quest aggregate data.
                          const _org = await db.collection("orgs").doc(orgId).get();
                          if (_org.exists) {
                            const org = _org.data();
                            const aggregateId = Number(Math.floor(Number(org?.listed_quests)/20).toFixed(0)) + 1;
                            const aggTemp: any = {};
                            aggTemp[`quests.${questId}.completed_by`] = FieldValue.increment(1);
                            const aggUpdateResponse = await db.collection("orgs").doc(orgId).collection("quests").doc("quest_agg_"+aggregateId.toString()).update(aggTemp);
                            if (aggUpdateResponse) {
                              return true;
                            }
                            await db.collection("orgs").doc(orgId).collection("quests").doc(questId).update(
                                {
                                  "completed_by": FieldValue.increment(-1),
                                }
                            );
                            await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_oldUserOrderAggData);
                            const _userTempDel: any = {};
                            _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
                            if (Object.keys(questData.actions).length == currentActionId) {
                              _userTempDel["quests_completed"] = FieldValue.increment(-1);
                            }
                            await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
                            await db.collection("users").doc(userId).update(user);
                            await db.collection("quest_order").doc(questOrderId).update(questData);
                            await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
                            return false;
                          }
                          await db.collection("orgs").doc(orgId).collection("quests").doc(questId).update(
                              {
                                "completed_by": FieldValue.increment(-1),
                              }
                          );
                          await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_oldUserOrderAggData);
                          const _userTempDel: any = {};
                          _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
                          if (Object.keys(questData.actions).length == currentActionId) {
                            _userTempDel["quests_completed"] = FieldValue.increment(-1);
                          }
                          await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
                          await db.collection("users").doc(userId).update(user);
                          await db.collection("quest_order").doc(questOrderId).update(questData);
                          await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
                          return false;
                        }
                        await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_oldUserOrderAggData);
                        const _userTempDel: any = {};
                        _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
                        if (Object.keys(questData.actions).length == currentActionId) {
                          _userTempDel["quests_completed"] = FieldValue.increment(-1);
                        }
                        await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
                        await db.collection("users").doc(userId).update(user);
                        await db.collection("quest_order").doc(questOrderId).update(questData);
                        await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
                        return false;
                      }
                      return true;
                    }
                    const _userTempDel: any = {};
                    _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
                    if (Object.keys(questData.actions).length == currentActionId) {
                      _userTempDel["quests_completed"] = FieldValue.increment(-1);
                    }
                    await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
                    await db.collection("users").doc(userId).update(user);
                    await db.collection("quest_order").doc(questOrderId).update(questData);
                    await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
                    return false;
                  }
                  // Update Quest Data & Quest Aggregate Data if quest completed.
                  if (Object.keys(questData.actions).length == currentActionId) {
                    const questId = questOrderId.split("|")[0];
                    const orgId = questId.split("_")[0];
                    const questInst = await db.collection("orgs").doc(orgId).collection("quests").doc(questId).update(
                        {
                          "completed_by": FieldValue.increment(1),
                        }
                    );
                    if (questInst) {
                      // Update Quest aggregate data.
                      const _org = await db.collection("orgs").doc(orgId).get();
                      if (_org.exists) {
                        const org = _org.data();
                        const aggregateId = Number(Math.floor(Number(org?.listed_quests)/20).toFixed(0)) + 1;
                        const aggTemp: any = {};
                        aggTemp[`quests.${questId}.completed_by`] = FieldValue.increment(1);
                        const aggUpdateResponse = await db.collection("orgs").doc(orgId).collection("quests").doc("quest_agg_"+aggregateId.toString()).update(aggTemp);
                        if (aggUpdateResponse) {
                          return true;
                        }
                        await db.collection("orgs").doc(orgId).collection("quests").doc(questId).update(
                            {
                              "completed_by": FieldValue.increment(-1),
                            }
                        );
                        await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_oldUserOrderAggData);
                        const _userTempDel: any = {};
                        _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
                        if (Object.keys(questData.actions).length == currentActionId) {
                          _userTempDel["quests_completed"] = FieldValue.increment(-1);
                        }
                        await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
                        await db.collection("users").doc(userId).update(user);
                        await db.collection("quest_order").doc(questOrderId).update(questData);
                        await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
                        return false;
                      }
                      await db.collection("orgs").doc(orgId).collection("quests").doc(questId).update(
                          {
                            "completed_by": FieldValue.increment(-1),
                          }
                      );
                      await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_oldUserOrderAggData);
                      const _userTempDel: any = {};
                      _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
                      if (Object.keys(questData.actions).length == currentActionId) {
                        _userTempDel["quests_completed"] = FieldValue.increment(-1);
                      }
                      await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
                      await db.collection("users").doc(userId).update(user);
                      await db.collection("quest_order").doc(questOrderId).update(questData);
                      await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
                      return false;
                    }
                    await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_oldUserOrderAggData);
                    const _userTempDel: any = {};
                    _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
                    if (Object.keys(questData.actions).length == currentActionId) {
                      _userTempDel["quests_completed"] = FieldValue.increment(-1);
                    }
                    await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
                    await db.collection("users").doc(userId).update(user);
                    await db.collection("quest_order").doc(questOrderId).update(questData);
                    await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
                    return false;
                  }
                  return true;
                }
                const _userTempDel: any = {};
                _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
                if (Object.keys(questData.actions).length == currentActionId) {
                  _userTempDel["quests_completed"] = FieldValue.increment(-1);
                }
                await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
                await db.collection("users").doc(userId).update(user);
                await db.collection("quest_order").doc(questOrderId).update(questData);
                await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
                return false;
              }
              const _userTempDel: any = {};
              _userTempDel["earned_rewards"] = FieldValue.increment(-Number(action?.reward_amount));
              if (Object.keys(questData.actions).length == currentActionId) {
                _userTempDel["quests_completed"] = FieldValue.increment(-1);
              }
              await db.collection("users").doc(userId).collection("public").doc("public").update({_userTempDel});
              await db.collection("users").doc(userId).update(user);
              await db.collection("quest_order").doc(questOrderId).update(questData);
              await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
              return false;
            }
            await db.collection("users").doc(userId).update(user);
            await db.collection("quest_order").doc(questOrderId).update(questData);
            await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
            return false;
          }
          await db.collection("quest_order").doc(questOrderId).update(questData);
          await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
          return false;
        }
        await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
        return false;
      }
      await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(data?.action_order_id).update(actionOrder);
      return false;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}
