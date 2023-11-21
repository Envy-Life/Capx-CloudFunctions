/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";

export async function claimInviterReward(
    userId: string,
    inviterId: string
) {
  try {
    const db = admin.firestore();

    // If user `earned_rewards` >= 20, Increment the inviter balance by 10xCapx Tokens
    const _inviterId = inviterId;
    const _inviter = await db.collection("users").doc(_inviterId).get();
    if (_inviter.exists) {
      // Check if already claimed
      const inviter: any = _inviter.data();
      let claimed = false;
      for (let i=0; i < inviter.claimed_bonus_users.length; i++) {
        if (inviter.claimed_bonus_users[i] == userId) {
          claimed = true;
          break;
        }
      }
      if (!claimed) {
        // Update Inviter rewards
        // 1. Inside the users (root-collection)
        // 2. Inside the users-public (sub-collection)
        // 3. Inside the users-invites (sub-collection)
        const __inviter = await db.collection("users").doc(inviterId).update({
          "earned_rewards": FieldValue.increment(10),
        });
        if (__inviter) {
          const __inviterPublic = await db.collection("users").doc(inviterId).collection("public").doc("public").update({
            "earned_rewards": FieldValue.increment(10),
          });
          if (__inviterPublic) {
            const __inviterInvites = await db.collection("users").doc(inviterId).collection("invites").doc("invites").update({
              "claimed_bonus_users": FieldValue.arrayUnion(userId),
            });
            if (__inviterInvites) {
              return true;
            }
            await db.collection("users").doc(inviterId).collection("public").doc("public").update({
              "earned_rewards": FieldValue.increment(-10),
            });
            await db.collection("users").doc(inviterId).update({
              "earned_rewards": FieldValue.increment(-10),
            });
            return false;
          }
          await db.collection("users").doc(inviterId).update({
            "earned_rewards": FieldValue.increment(-10),
          });
          return false;
        }
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}
