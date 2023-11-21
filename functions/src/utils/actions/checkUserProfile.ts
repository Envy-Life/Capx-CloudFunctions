/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {CallableContext} from "firebase-functions/v1/https";

export async function checkUserProfile(
    context : CallableContext
) {
  if (!context.auth?.uid) {
    return false;
  }
  try {
    const db = admin.firestore();

    // Check if username entered.
    const _user = await db.collection("users").doc(context.auth?.uid).get();
    if (_user.exists) {
      const user: any = _user.data();
      if (user.name) {
        if (user.name != "") {
          if (user.image) {
            if (user.image != "") {
              if (user.socials.twitter_id) {
                if (user.socials.twitter_id != "") {
                  if (user.socials.google_id) {
                    if (user.socials.google_id != "") {
                      return true;
                    }
                    return false;
                  }
                  return false;
                }
                return false;
              }
              return false;
            }
            return false;
          }
          return false;
        }
        return false;
      }
      return false;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}
