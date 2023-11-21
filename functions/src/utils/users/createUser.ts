/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";
import {CallableContext} from "firebase-functions/v1/https";
import {UserType} from "../enums/userType";
import {getUsernameFromId} from "../twitter/getUsernameFromId";

export async function createUser(
    context : CallableContext,
    data: any
) {
  try {
    if (!context.auth?.token.email || !context.auth?.uid ) {
      return {success: false, message: "ERROR: Invalid Token"};
    }
    const db = admin.firestore();

    // check if Username is unique
    const _checkUsername = await db.collection("users").where("username", "==", data.username).get();
    if (_checkUsername.size > 0) {
      return {success: false, message: "ERROR: Username already linked."};
    }

    // Check if Email is unique
    if (context.auth?.token.email) {
      const _checkEmail = await db.collection("users").where("email", "==", context.auth?.token.email?.toString()).get();
      if (_checkEmail.size > 0) {
        return {success: false, message: "ERROR: Email already linked."};
      }
    }
    // Check if Twitter ID is unique
    let twitterUsername = "";
    if (context.auth?.token.firebase.identities["twitter.com"]) {
      twitterUsername = await getUsernameFromId(context.auth?.token.firebase.identities["twitter.com"][0].toString());
      const _checkTwitter = await db.collection("users").where("socials.twitter_id", "==", context.auth?.token.firebase.identities["twitter.com"][0].toString()).get();
      if (_checkTwitter.size > 0) {
        return {success: false, message: "ERROR: Twitter already linked."};
      }
    }
    // Check if Email is unique
    if (context.auth?.token.firebase.identities["google.com"]) {
      const _checkGoogle = await db.collection("users").where("socials.google_id", "==", context.auth?.token.firebase.identities["google.com"][0].toString()).get();
      if (_checkGoogle.size > 0) {
        return {success: false, message: "ERROR: Google already linked."};
      }
    }

    // Check if Invite Code is valid
    const _inviter = await db.collection("users").where("generated_invite_code", "==", data.inviteCode).get();
    if (_inviter.size != 1) {
      // As unique Invite code is generated, each invite code would have only one user mapped to it.
      return {success: false, message: "ERROR: Invalid invite code!"};
    }
    const inviterId = _inviter.docs[0].id;
    let superInviterId = "";
    if (_inviter.docs[0].data().inviter_id) {
      superInviterId = _inviter.docs[0].data().inviter_id;
    }

    // Check if the number of users invited are valid
    const _invites = await db.collection("users").doc(inviterId).collection("invites").doc("invites").get();
    if (_invites.exists) {
      const invitesData: any = _invites.data();
      if (_inviter.docs[0].data()?.type == UserType.Admin) {
        // Check for the expiry.
        if (invitesData.expiry < Math.ceil(new Date().getTime() / 1000) && !invitesData.enabled) {
          return {success: false, message: "ERROR: Invite Code Expired!"};
        }
      }
      if (Number(invitesData.invited_users.length)+1 > Number(invitesData.max_invites)) {
        return {success: false, message: "ERROR: Too many invites"};
      }
    } else {
      return {success: false, message: "ERROR: Invalid Invite code!"};
    }

    const joinCount = await db.collection("users").count().get();

    const userObject = {
      "docType": "Individual",
      "name": data?.name ? data.name : data.username,
      "username": data.username,
      "image_url": context.auth.token?.picture ? context.auth.token.picture : "",
      "email": context.auth.token?.email ? context.auth.token.email : "",
      "socials": {
        "twitter_username": twitterUsername,
        "twitter_id": context.auth?.token.firebase.identities["twitter.com"] ? context.auth?.token.firebase.identities["twitter.com"][0] : "",
        "google_id": context.auth?.token.firebase.identities["google.com"] ? context.auth?.token.firebase.identities["google.com"][0] : "",
      },
      "wallets": {
        "evm": "",
        "solana": "",
      },
      "join_tag": joinCount.data().count + 1,
      "rank": Number(0),
      "level": Number(0),
      "invites": Number(0),
      "earned_rewards": Number(0),
      "quests_completed": Number(0),
      "inviter_id": inviterId,
      "generated_invite_code": "",
      "quests_registered": Number(0),
      "type": UserType.Individual,
      "registered_on": Math.ceil(new Date().getTime()/1000),
    };

    // Individual Document
    const _user = db.collection("users").doc(context.auth.uid);
    const _response = await _user.set(userObject);
    if (_response) {
      // Creating Public Document
      const userPublicObject = {
        "docType": "Individual",
        "name": data?.name ? data.name : data.username,
        "username": data.username,
        "image_url": context.auth.token?.picture ? context.auth.token.picture : "",
        "socials": {
          "twitter_username": twitterUsername,
          "twitter_id": context.auth?.token.firebase.identities["twitter.com"] ? context.auth?.token.firebase.identities["twitter.com"][0] : "",
          "google_id": context.auth?.token.firebase.identities["google.com"] ? context.auth?.token.firebase.identities["google.com"][0] : "",
        },
        "rank": Number(0),
        "level": Number(0),
        "invites": Number(0),
        "earned_rewards": Number(0),
        "quests_completed": Number(0),
      };
      const _userPublic = db.collection("users").doc(context.auth.uid).collection("public").doc("public");
      const _userPublicResponse = await _userPublic.set(userPublicObject);
      if (_userPublicResponse) {
        // Update Inviter data. (Rewards, Invites_number)
        // 1. Inside the users (root-collection)
        // 2. Inside the users-public (subCollection)
        // 3. Inside the users-invites (subCollection)
        const __inviter = await db.collection("users").doc(inviterId).update({
          "earned_rewards": FieldValue.increment(1),
          "invites": FieldValue.increment(1),
        });
        if (__inviter) {
          const __inviterPublic = await db.collection("users").doc(inviterId).collection("public").doc("public").update({
            "earned_rewards": FieldValue.increment(1),
            "invites": FieldValue.increment(1),
          });
          if (__inviterPublic) {
            const __inviterInvites = await db.collection("users").doc(inviterId).collection("invites").doc("invites").update({
              "invited_users": FieldValue.arrayUnion(context.auth.uid),
            });
            if (__inviterInvites) {
              if (superInviterId != "") {
                // Update the OG inviter rewards
                const __superInviter = await db.collection("users").doc(superInviterId).update({
                  "earned_rewards": FieldValue.increment(1),
                });
                if (__superInviter) {
                  const __superInviterPublic = await db.collection("users").doc(superInviterId).collection("public").doc("public").update({
                    "earned_rewards": FieldValue.increment(1),
                  });
                  if (__superInviterPublic) {
                    // Update the invite_codes collection.
                    const inviteCodeCol = await db.collection("invite_codes").doc(data?.inviteCode).update({
                      "invited_users": FieldValue.arrayUnion(context.auth.uid),
                    });
                    if (inviteCodeCol) {
                      return {success: true, message: "SUCCESS: User created."};
                    }
                    await db.collection("users").doc(inviterId).collection("invites").doc("invites").update({
                      "invited_users": FieldValue.arrayRemove(context.auth.uid),
                    });
                    await db.collection("users").doc(superInviterId).collection("public").doc("public").update({
                      "earned_rewards": FieldValue.increment(-1),
                    });
                    await db.collection("users").doc(superInviterId).update({
                      "earned_rewards": FieldValue.increment(-1),
                    });
                    await db.collection("users").doc(inviterId).collection("public").doc("public").update({
                      "earned_rewards": FieldValue.increment(-1),
                      "invites": FieldValue.increment(-1),
                    });
                    await db.collection("users").doc(inviterId).update({
                      "earned_rewards": FieldValue.increment(-1),
                      "invites": FieldValue.increment(-1),
                    });
                    await _user.delete();
                    return {success: false, message: "ERROR: Creating User!"};
                  }
                  await db.collection("users").doc(inviterId).collection("invites").doc("invites").update({
                    "invited_users": FieldValue.arrayRemove(context.auth.uid),
                  });
                  await db.collection("users").doc(superInviterId).update({
                    "earned_rewards": FieldValue.increment(-1),
                  });
                  await db.collection("users").doc(inviterId).collection("public").doc("public").update({
                    "earned_rewards": FieldValue.increment(-1),
                    "invites": FieldValue.increment(-1),
                  });
                  await db.collection("users").doc(inviterId).update({
                    "earned_rewards": FieldValue.increment(-1),
                    "invites": FieldValue.increment(-1),
                  });
                  await _user.delete();
                  return {success: false, message: "ERROR: Creating User!"};
                }
                await db.collection("users").doc(inviterId).collection("invites").doc("invites").update({
                  "invited_users": FieldValue.arrayRemove(context.auth.uid),
                });
                await db.collection("users").doc(inviterId).collection("public").doc("public").update({
                  "earned_rewards": FieldValue.increment(-1),
                  "invites": FieldValue.increment(-1),
                });
                await db.collection("users").doc(inviterId).update({
                  "earned_rewards": FieldValue.increment(-1),
                  "invites": FieldValue.increment(-1),
                });
                await _user.delete();
                return {success: false, message: "ERROR: Creating User!"};
              }
              // Update the invite_codes collection.
              const inviteCodeCol = await db.collection("invite_codes").doc(data?.inviteCode).update({
                "invited_users": FieldValue.arrayUnion(context.auth.uid),
              });
              if (inviteCodeCol) {
                return {success: true, message: "SUCCESS: User created."};
              }
              await db.collection("users").doc(inviterId).collection("invites").doc("invites").update({
                "invited_users": FieldValue.arrayRemove(context.auth.uid),
              });
              await db.collection("users").doc(inviterId).collection("public").doc("public").update({
                "earned_rewards": FieldValue.increment(-1),
                "invites": FieldValue.increment(-1),
              });
              await db.collection("users").doc(inviterId).update({
                "earned_rewards": FieldValue.increment(-1),
                "invites": FieldValue.increment(-1),
              });
              await _user.delete();
              return {success: false, message: "ERROR: Creating User!"};
            }
            await db.collection("users").doc(inviterId).collection("public").doc("public").update({
              "earned_rewards": FieldValue.increment(-1),
              "invites": FieldValue.increment(-1),
            });
            await db.collection("users").doc(inviterId).update({
              "earned_rewards": FieldValue.increment(-1),
              "invites": FieldValue.increment(-1),
            });
            await _user.delete();
            return {success: false, message: "ERROR: Creating User!"};
          }
          await db.collection("users").doc(inviterId).update({
            "earned_rewards": FieldValue.increment(-1),
            "invites": FieldValue.increment(-1),
          });
          await _user.delete();
          return {success: false, message: "ERROR: Creating User!"};
        }
        await _user.delete();
        return {success: false, message: "ERROR: Creating User!"};
      } else {
        await _user.delete();
        return {success: false, message: "ERROR: Creating User!"};
      }
    } else {
      return {success: false, message: "ERROR: Creating User!"};
    }
  } catch (err) {
    console.log(err);
    return {success: false, message: "ERROR"};
  }
}
