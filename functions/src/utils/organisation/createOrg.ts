/* eslint-disable max-len */
import * as crypto from "crypto";
import * as admin from "firebase-admin";
import {CallableContext} from "firebase-functions/v1/https";
import {getUsernameFromId} from "../twitter/getUsernameFromId";

export async function createOrg(
    context: CallableContext,
    data: any
) {
  if (!context.auth?.token.email) {
    return {success: false, message: "ERROR: Invalid Token"};
  }
  if (context.auth?.token.email.toString() != "shreyas@capx.global") {
    return {success: false, message: "ERROR: Insufficient Permissions"};
  }

  try {
    const db = admin.firestore();

    // Check if Email is unique
    const _checkEmail = await db.collection("orgs").where("email", "==", context.auth?.token.email?.toString()).get();
    if (_checkEmail.size > 0) {
      return {success: false, message: "ERROR: Organisation email already linked."};
    }
    // Check if Twitter ID is unique
    let twitterUsername = "";
    if (context.auth?.token.firebase.identities["twitter.com"]) {
      twitterUsername = await getUsernameFromId(context.auth?.token.firebase.identities["twitter.com"][0].toString());
      const _checkTwitter = await db.collection("orgs").where("socials.twitter_id", "==", context.auth?.token.firebase.identities["twitter.com"][0].toString()).get();
      if (_checkTwitter.size > 0) {
        return {success: false, message: "ERROR: Twitter already linked."};
      }
    }
    // Check if Gmail ID is unique
    if (context.auth?.token.firebase.identities["google.com"]) {
      const _checkGoogle = await db.collection("orgs").where("socials.google_id", "==", context.auth?.token.firebase.identities["google.com"][0].toString()).get();
      if (_checkGoogle.size > 0) {
        return {success: false, message: "ERROR: Google already linked."};
      }
    }
    const orgObject = {
      doc_type: "Individual",
      name: data.name,
      description: data.description,
      image: context.auth?.token.picture ? context.auth?.token.picture.toString() : "",
      tags: data.tags,
      listed_quests: Number(0),
      website: data.website,
      email: context.auth?.token.email,
      socials: {
        "twitter_id": context.auth?.token.firebase.identities["twitter.com"] ? context.auth?.token.firebase.identities["twitter.com"][0].toString() : "",
        "google_id": context.auth?.token.firebase.identities["google.com"] ? context.auth?.token.firebase.identities["google.com"][0] : "",
      },
    };
    const _email: string = context.auth?.token?.email?.toString();
    const _orgId = crypto.createHash("sha256").update(_email).digest("base64");

    const _org = db.collection("orgs").doc(_orgId);
    const _response = await _org.set(orgObject);
    if (_response) {
      const orgPublic: any = {
        doc_type: "Individual",
        name: data.name,
        description: data.description,
        image: context.auth?.token.picture ? context.auth?.token.picture.toString() : "",
        tags: data.tags,
        listed_quests: Number(0),
        website: data.website,
      };
      if (twitterUsername !== "") {
        orgPublic["socials"] = {twitter_username: twitterUsername};
      }
      const _orgPublic = db.collection("orgs").doc(_orgId).collection("public").doc("public");
      const _responsePub = await _orgPublic.set(orgPublic);
      if (_responsePub) {
        return {success: true, message: "SUCCESS: Organisation created."};
      }
      await db.collection("orgs").doc(_orgId).delete();
      return {success: false, message: "ERROR: Creating Organisation!"};
    } else {
      return {success: false, message: "ERROR: Creating Organisation!"};
    }
  } catch (err) {
    console.error(err);
    return {success: false, message: "ERROR!"};
  }
}
