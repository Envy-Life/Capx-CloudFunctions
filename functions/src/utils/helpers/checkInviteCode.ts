/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {UserType} from "../enums/userType";

export async function checkInviteCode(
    inviteCode: string
) {
  try {
    const db = admin.firestore();

    // Check if invite code is valid
    const _inviteCode = await db.collection("invite_codes").doc(inviteCode).get();
    if (_inviteCode.exists) {
      // Check if the invite_code is system generated or user generated.
      const inviteCodeData: any = _inviteCode.data();
      if (inviteCodeData?.user_type == UserType.Admin) {
        // Check for the expiry.
        if (inviteCodeData.expiry < Math.ceil(new Date().getTime() / 1000) && !inviteCodeData.enabled) {
          return false;
        }
      }

      // Check if the number of users invited are valid.
      if (Number(inviteCodeData?.invited_users.length) + 1 > Number(inviteCodeData?.max_invites)) {
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
}
