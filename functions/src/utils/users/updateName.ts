/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {CallableContext} from "firebase-functions/v1/https";

export async function updateName(
    context: CallableContext,
    data: any
) {
  try {
    if (context.auth?.uid) {
      const db = admin.firestore();
      const _user = await db.collection("users").doc(context.auth.uid).get();
      if (_user.exists) {
        const name = _user.data()?.name;
        const res = await db.collection("users").doc(context.auth.uid).update(
            {
              "name": data.name,
            }
        );
        if (res) {
          // Updating Public Data
          const _userPublicData = await db.collection("users").doc(context.auth.uid).collection("public").doc("public").get();
          if (_userPublicData.exists) {
            const resPub = await db.collection("users").doc(context.auth.uid).collection("public").doc("public").update(
                {
                  "name": data.name,
                }
            );
            if (resPub) {
              return {success: true, message: "SUCCESS: User Name updated!"};
            } else {
              await db.collection("users").doc(context.auth.uid).update({"name": name});
              return {success: false, message: "ERROR: Unable to Update"};
            }
          } else {
            await db.collection("users").doc(context.auth.uid).update({"name": name});
            return {success: false, message: "ERROR: Unable to Update"};
          }
        } else {
          return {success: false, message: "ERROR: Unable to UPDATE."};
        }
      } else {
        return {success: false, message: "ERROR: User not signed up"};
      }
    }
    return {success: false, message: "ERROR: Invalid Token!"};
  } catch (err) {
    console.log("ERROR:", err);
    return {success: false, message: "ERROR: Invalid Token"};
  }
}
