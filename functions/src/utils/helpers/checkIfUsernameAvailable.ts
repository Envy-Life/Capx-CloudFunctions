/* eslint-disable max-len */
import * as admin from "firebase-admin";

export async function checkIfUsernameAvailable(
    username: string
) {
  try {
    const db = admin.firestore();

    const docs = await db.collection("users").where("username", "==", username).get();
    return !(docs.size > 0);
  } catch (err) {
    console.error(err);
    return false;
  }
}
