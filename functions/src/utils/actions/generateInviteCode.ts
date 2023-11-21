/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {CallableContext} from "firebase-functions/v1/https";
import {UserType} from "../enums/userType";
import {customAlphabet} from "nanoid";

export async function generateInviteCode(
    context: CallableContext,
    data: any
) {
  if (!context.auth?.uid ) {
    return {success: false, message: "ERROR: Invalid Token"};
  }
  try {
    const db = admin.firestore();

    // Check if the user already has a generated_referral_code
    const _user = await db.collection("users").doc(context?.auth.uid).get();
    if (_user.exists) {
      const user: any = _user.data();
      if (user.generated_invite_code == "") {
        // TODO: Generate the invite code.
        const inviteCodeGen = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 5);
        let _generatedInviteCode = inviteCodeGen().toUpperCase();
        // Check if generated root code is unique.
        const flag = true;
        while (flag) {
          const _isUnique = await db.collection("invite_codes").doc(_generatedInviteCode).get();
          if (!_isUnique.exists) {
            break;
          }
          _generatedInviteCode = inviteCodeGen().toUpperCase();
        }
        const _inviteCodeObj: any = {};
        _inviteCodeObj["user_id"] = context.auth.uid;
        _inviteCodeObj["user_type"] = UserType.Individual;
        _inviteCodeObj["max_invites"] = Number(3);
        _inviteCodeObj["invited_users"] = [];
        if (user?.type == UserType.Admin) {
          // Check if expiry, max_invites value passed in data object
          if (data.expiry && data.max_invites) {
            console.log(new Date(data.expiry).getTime() > Date.now());
            console.log(Number(data.max_invites) != 0);
            if (new Date(data.expiry).getTime() > Date.now() && Number(data.max_invites) != 0) {
              _inviteCodeObj["user_type"] = UserType.Admin;
              _inviteCodeObj["max_invites"] = Number(data.max_invites);
              _inviteCodeObj["expiry"] = Math.ceil(new Date(data.expiry).getTime() / 1000);
              _inviteCodeObj["enabled"] = Boolean(true);
            } else {
              return {success: false, message: "ERROR! Invalid value for parameter `expiry` (or) `max_invites`"};
            }
          } else {
            return {success: false, message: "ERROR! Missing one (or) parameters `expiry`, `max_invites`"};
          }
        }
        const _inviteCode = await db.collection("invite_codes").doc(_generatedInviteCode).set(_inviteCodeObj);
        if (_inviteCode) {
          // Update generated_invite_code in users object.
          const _updateUser = await db.collection("users").doc(context?.auth.uid).update(
              {
                "generated_invite_code": _generatedInviteCode,
              }
          );
          if (_updateUser) {
            // Create Invites sub-collection
            const _invitesSubObj: any = {
              "docType": "Aggregate",
              "max_invites": user?.type == UserType.Admin ? Number(data.max_invites) : Number(3),
              "invited_users": [],
              "claimed_bonus_users": [],
            };
            if (user?.type == UserType.Admin) {
              _invitesSubObj["expiry"] = Math.ceil(new Date(data.expiry).getTime() / 1000);
              _invitesSubObj["enabled"] = Boolean(true);
            }
            const _invitesSub = await db.collection("users").doc(context?.auth.uid).collection("invites").doc("invites").set(
                _invitesSubObj
            );
            if (_invitesSub) {
              return {success: true, message: "SUCCESS!", invite_code: _generatedInviteCode};
            }
            await db.collection("invite_codes").doc(_generatedInviteCode).delete();
            await db.collection("users").doc(context?.auth.uid).update(user);
            return {success: false, message: "ERROR: Unable to process request!"};
          }
          await db.collection("invite_codes").doc(_generatedInviteCode).delete();
          return {success: false, message: "ERROR: Unable to process request!"};
        }
        return {success: false, message: "ERROR: Code generation failed!"};
      }
      return {success: false, message: "ERROR: Code already generated!", invite_code: user.generated_invite_code};
    }
    return {success: false, message: "ERROR: Unable to process request!"};
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR!"};
  }
}
