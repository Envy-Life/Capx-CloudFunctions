/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {CallableContext} from "firebase-functions/v1/https";

export async function linkSOLWallet(
    context : CallableContext,
    data: any
) {
  if (context.auth?.uid) {
    try {
      const db = admin.firestore();
      const _user = await db.collection("users").doc(context.auth.uid).get();
      if (_user.exists) {
        const userData = _user.data();
        if (userData?.wallets["solana"] == "") {
          const res = await db.collection("users").doc(context.auth.uid).update(
              {
                "wallets.solana": data.sol_address,
              }
          );
          if (res) {
            return {success: true, message: "SUCCESS: Updated successful."};
          } else {
            return {success: false, message: "ERROR: Unable to UPDATE."};
          }
        } else {
          return {success: false, message: "ERROR: Wallet already linked!"};
        }
      } else {
        return {success: false, message: "ERROR: User not signed up"};
      }
    } catch (err) {
      console.log("ERROR:", err);
      return {success: false, message: "ERROR: Unable to Update"};
    }
  } else {
    return {success: false, message: "ERROR: Invalid Auth Token!"};
  }
}
