/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {CallableContext} from "firebase-functions/v1/https";
import {getUsernameFromId} from "../twitter/getUsernameFromId";

export async function linkTwitter(
    context: CallableContext
) {
  if (context.auth?.uid) {
    try {
      const db = admin.firestore();
      const _user = await db.collection("users").doc(context.auth.uid).get();
      if (_user.exists) {
        const userData = _user.data();
        if (userData?.socials["twitter_id"] == "") {
          const _username = await getUsernameFromId(context.auth?.token.firebase.identities["twitter.com"][0].toString());
          const res = await db.collection("users").doc(context.auth.uid).update(
              {
                "socials.twitter_id": context.auth?.token.firebase.identities["twitter.com"][0],
                "socials.twitter_username": _username,
              }
          );
          if (res) {
            // Updating Public Data
            const _userPublicData = await db.collection("users").doc(context.auth.uid).collection("public").doc("public").get();
            if (_userPublicData.exists) {
              const resPub = await db.collection("users").doc(context.auth.uid).collection("public").doc("public").update(
                  {
                    "socials.twitter_id": context.auth?.token.firebase.identities["twitter.com"][0],
                    "socials.twitter_username": _username,
                  }
              );
              if (resPub) {
                return {success: true, message: "SUCCESS: User updated."};
              } else {
                await db.collection("users").doc(context.auth.uid).update(userData);
                return {success: false, message: "ERROR: Unable to UPDATE."};
              }
            } else {
              await db.collection("users").doc(context.auth.uid).update(userData);
              return {success: false, message: "ERROR: Unable to UPDATE."};
            }
          } else {
            return {success: false, message: "ERROR: Unable to UPDATE."};
          }
        } else {
          return {success: false, message: "ERROR: Twitter already linked."};
        }
      }
      return {success: false, message: "ERROR: User not signed up"};
    } catch (err) {
      console.log(err);
      return {success: false, message: "ERROR: Invalid Token"};
    }
  }
  return {success: false, message: "ERROR: Invalid Token"};
}
