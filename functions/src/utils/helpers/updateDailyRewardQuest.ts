/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {OrderStatus} from "../enums/orderStatus";
import {ActionType} from "../enums/actionType";
import {FieldValue} from "firebase-admin/firestore";
import {claimInviterReward} from "./claimInviterReward";
import {StatusType} from "../enums/statusType";

export async function updateDailyRewardQuest(
    user: any,
    action: any,
    actionOrder: any,
    userId: string,
    actionOrderId: string,
    questOrderId: string
) {
  if (action?.type != ActionType.DailyReward) {
    return false;
  }
  const db = admin.firestore();
  try {
    // Check if the quest is already in progress (or) it's the first claim
    if (actionOrder.action_order_status == OrderStatus.PENDING) {
      // 1. Update Action Order : Status -> IN_PROGRESS.
      const updateActionOrder = await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
        action_order_status: OrderStatus.IN_PROGRESS,
        last_claimed_at: Number(Math.floor(Math.ceil(new Date().getTime() / 1000) / 86400) * 86400),
      });
      if (updateActionOrder) {
        // 2. Update Quest Order : Actions -> Status,  Status -> IN_PROGRESS, points_rewarded + 1
        const _questOrderTemp: any = {};
        _questOrderTemp[`actions.${actionOrderId}.action_order_status`] = OrderStatus.IN_PROGRESS;
        _questOrderTemp["points_rewarded"] = FieldValue.increment(Number(action?.reward_amount));
        _questOrderTemp["status"] = StatusType.IN_PROGRESS;
        const updateQuestOrder = await db.collection("quest_order").doc(questOrderId).update(_questOrderTemp);
        if (updateQuestOrder) {
          // 3. Update User & User Public Collection: earned_rewards + 1
          const updateUser = await db.collection("users").doc(userId).update({earned_rewards: FieldValue.increment(Number(action?.reward_amount))});
          if (updateUser) {
            const updateUserPublic = await db.collection("users").doc(userId).collection("public").doc("public").update({earned_rewards: FieldValue.increment(Number(action?.reward_amount))});
            if (updateUserPublic) {
              // 4. Update user-quest-order data: Status -> IN_PROGRESS.
              const _aggId = Number(Math.floor(Number(user?.quests_registered)/20).toFixed(0)) + 1;
              const _userOrderAgg = await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).get();
              if (_userOrderAgg.exists) {
                const _newUserOrderAggData: any = {};
                _newUserOrderAggData[`quests.${questOrderId}.status`] = StatusType.IN_PROGRESS;
                const _updateUserOrderAgg = await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_newUserOrderAggData);
                if (_updateUserOrderAgg) {
                  // 5. Update bonus inviter reward (if any)
                  if (Number(user?.earned_rewards) + Number(action?.reward_amount) >= 20) {
                    const _claimStatus = await claimInviterReward(userId, user?.inviter_id);
                    if (_claimStatus) {
                      return true;
                    }
                    const _newUserOrderAggData: any = {};
                    _newUserOrderAggData[`quests.${questOrderId}.status`] = StatusType.REGISTERED;
                    await db.collection("users").doc(userId).collection("quest-order").doc(_aggId.toString()).update(_newUserOrderAggData);
                    await db.collection("users").doc(userId).collection("public").doc("public").update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
                    await db.collection("users").doc(userId).update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
                    const _questOrderTemp: any = {};
                    _questOrderTemp[`actions.${actionOrderId}.action_order_status`] = OrderStatus.PENDING;
                    _questOrderTemp["points_rewarded"] = FieldValue.increment(-Number(action?.reward_amount));
                    _questOrderTemp["status"] = StatusType.REGISTERED;
                    await db.collection("quest_order").doc(questOrderId).update(_questOrderTemp);
                    await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
                      action_order_status: OrderStatus.PENDING,
                      last_claimed_at: action?.last_claimed_at,
                    });
                    return false;
                  }
                  return true;
                }
                await db.collection("users").doc(userId).collection("public").doc("public").update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
                await db.collection("users").doc(userId).update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
                const _questOrderTemp: any = {};
                _questOrderTemp[`actions.${actionOrderId}.action_order_status`] = OrderStatus.PENDING;
                _questOrderTemp["points_rewarded"] = FieldValue.increment(-Number(action?.reward_amount));
                _questOrderTemp["status"] = StatusType.REGISTERED;
                await db.collection("quest_order").doc(questOrderId).update(_questOrderTemp);
                await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
                  action_order_status: OrderStatus.PENDING,
                  last_claimed_at: action?.last_claimed_at,
                });
                return false;
              }
              await db.collection("users").doc(userId).collection("public").doc("public").update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
              await db.collection("users").doc(userId).update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
              const _questOrderTemp: any = {};
              _questOrderTemp[`actions.${actionOrderId}.action_order_status`] = OrderStatus.PENDING;
              _questOrderTemp["points_rewarded"] = FieldValue.increment(-Number(action?.reward_amount));
              _questOrderTemp["status"] = StatusType.REGISTERED;
              await db.collection("quest_order").doc(questOrderId).update(_questOrderTemp);
              await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
                action_order_status: OrderStatus.PENDING,
                last_claimed_at: action?.last_claimed_at,
              });
              return false;
            }
            await db.collection("users").doc(userId).update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
            const _questOrderTemp: any = {};
            _questOrderTemp[`actions.${actionOrderId}.action_order_status`] = OrderStatus.PENDING;
            _questOrderTemp["points_rewarded"] = FieldValue.increment(-Number(action?.reward_amount));
            _questOrderTemp["status"] = StatusType.REGISTERED;
            await db.collection("quest_order").doc(questOrderId).update(_questOrderTemp);
            await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
              action_order_status: OrderStatus.PENDING,
              last_claimed_at: action?.last_claimed_at,
            });
            return false;
          }
          const _questOrderTemp: any = {};
          _questOrderTemp[`actions.${actionOrderId}.action_order_status`] = OrderStatus.PENDING;
          _questOrderTemp["points_rewarded"] = FieldValue.increment(-Number(action?.reward_amount));
          _questOrderTemp["status"] = StatusType.REGISTERED;
          await db.collection("quest_order").doc(questOrderId).update(_questOrderTemp);
          await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
            action_order_status: OrderStatus.PENDING,
            last_claimed_at: action?.last_claimed_at,
          });
          return false;
        }
        await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
          action_order_status: OrderStatus.PENDING,
          last_claimed_at: action?.last_claimed_at,
        });
        return false;
      }
      return false;
    }
    // Already IN-PROGRESS
    // 1. Update Action Order : last_claimed_at
    const updateActionOrder = await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
      last_claimed_at: Number(Math.floor(Math.ceil(new Date().getTime() / 1000) / 86400) * 86400),
    });
    if (updateActionOrder) {
      // 2. Update Quest Order : points_rewarded + 1
      const updateQuestOrder = await db.collection("quest_order").doc(questOrderId).update({
        points_rewarded: FieldValue.increment(Number(action?.reward_amount)),
      });
      if (updateQuestOrder) {
        // 3. Update User & User Public collection: earned_rewards + 1
        const updateUser = await db.collection("users").doc(userId).update({earned_rewards: FieldValue.increment(Number(action?.reward_amount))});
        if (updateUser) {
          const updateUserPublic = await db.collection("users").doc(userId).collection("public").doc("public").update({earned_rewards: FieldValue.increment(Number(action?.reward_amount))});
          if (updateUserPublic) {
            // 4. Update Bonus inviter reward (if any)
            if (Number(user?.earned_rewards) + Number(action?.reward_amount) >= 20) {
              const _claimStatus = await claimInviterReward(userId, user?.inviter_id);
              if (_claimStatus) {
                return true;
              }
              await db.collection("users").doc(userId).collection("public").doc("public").update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
              await db.collection("users").doc(userId).update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
              await db.collection("quest_order").doc(questOrderId).update({
                points_rewarded: FieldValue.increment(-Number(action?.reward_amount)),
              });
              await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
                last_claimed_at: action?.last_claimed_at,
              });
              return false;
            }
            return true;
          }
          await db.collection("users").doc(userId).update({earned_rewards: FieldValue.increment(-Number(action?.reward_amount))});
          await db.collection("quest_order").doc(questOrderId).update({
            points_rewarded: FieldValue.increment(-Number(action?.reward_amount)),
          });
          await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
            last_claimed_at: action?.last_claimed_at,
          });
          return false;
        }
        await db.collection("quest_order").doc(questOrderId).update({
          points_rewarded: FieldValue.increment(-Number(action?.reward_amount)),
        });
        await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
          last_claimed_at: action?.last_claimed_at,
        });
        return false;
      }
      await db.collection("quest_order").doc(questOrderId).collection("action_order").doc(actionOrderId).update({
        last_claimed_at: action?.last_claimed_at,
      });
      return false;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}
