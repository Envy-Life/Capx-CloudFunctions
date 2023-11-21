/* eslint-disable max-len */
import * as admin from "firebase-admin";

export async function createAdmin() {
  const db = admin.firestore();
  const UserObject = {
    "inviter_id": "",
    "username": "capx",
    "type": "Admin",
    "level": 0,
    "socials": {
      "twitter_username": "CapxFi",
    },
    "earned_rewards": 0,
    "email": "capx@capx.global",
    "generated_invite_code": "XCAPX",
    "image_url": "",
    "quests_completed": 0,
    "quests_registered": 0,
    "join_tag": 0,
    "invites": 0,
    "docType": "Individual",
    "name": "Capx",
  };

  const UserObjectPublic = {
    "docType": "Individual",
    "level": 0,
    "username": "capx",
    "socials": {
      "twitter_username": "CapxFi",
    },
    "image_url": "",
    "rank": 0,
    "invites": 0,
    "earned_rewards": 0,
    "name": "Capx",
  };

  const UserInvitesObj = {
    "docType": "Aggregate",
    "expiry": "2023-12-31",
    "enabled": true,
    "invited_users": [],
    "max_invites": 1000,
    "claimed_bonus_users": [],
  };

  const inviteCodes = {
    "user_id": "ffkjfwgjaN7WNyCggX8V",
    "expiry": "2023-12-31",
    "max_invites": 1000,
    "enabled": true,
    "invited_users": [],
    "user_type": "Admin",
  };

  await db.collection("invite_codes").doc("XCAPX").create(inviteCodes);
  await db.collection("users").doc("ffkjfwgjaN7WNyCggX8V").create(UserObject);
  await db.collection("users").doc("ffkjfwgjaN7WNyCggX8V").collection("public").doc("public").create(UserObjectPublic);
  await db.collection("users").doc("ffkjfwgjaN7WNyCggX8V").collection("invites").doc("invites").create(UserInvitesObj);

  return true;
}
