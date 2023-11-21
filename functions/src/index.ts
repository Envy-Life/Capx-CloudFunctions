/* eslint-disable max-len */
import * as functions from "firebase-functions";
import {createOrg} from "./utils/organisation/createOrg";
import {createQuest} from "./utils/organisation/createQuest";
import {createUser} from "./utils/users/createUser";
import {checkIfUsernameAvailable} from "./utils/helpers/checkIfUsernameAvailable";
import {checkInviteCode} from "./utils/helpers/checkInviteCode";
import {linkTwitter} from "./utils/users/linkTwitter";
import {linkGoogle} from "./utils/users/linkGoogle";
import {updateImage} from "./utils/users/updateImage";
import {linkEVMWallet} from "./utils/users/linkEVMWallet";
import {linkSOLWallet} from "./utils/users/linkSOLWallet";
import {updateName} from "./utils/users/updateName";

import * as admin from "firebase-admin";
import {checkIfUserFollows} from "./utils/twitter/checkIfUserFollows";
import {checkIfUserLikedTweet} from "./utils/twitter/checkIfUserLikedTweet";
import {checkIfUserRetweeted} from "./utils/twitter/checkIfUserRetweeted";
import {checkIfUserCommented} from "./utils/twitter/checkIfUserCommented";
import {checkIfUserQuoted} from "./utils/twitter/checkIfUserQuoted";
import {validateActionStruct} from "./utils/helpers/validateActionStruct";
import {generateInviteCode} from "./utils/actions/generateInviteCode";
import {registerForQuest} from "./utils/organisation/registerForQuest";
import {completeAction} from "./utils/organisation/completeAction";
import {verifyInviteCode} from "./utils/actions/verifyInviteCode";
import {createAdmin} from "./utils/createAdmin";
import {QuestType} from "./utils/enums/questType";

admin.initializeApp();

exports.x_checkIfUsernameAvailable = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  try {
    if (data.username) {
      const _username = data.username.replace("@", "").toLowerCase();
      if (_username.length > 4) {
        const res = await checkIfUsernameAvailable(_username);
        if (res) {
          return {success: true, message: "SUCCESS: Username available"};
        }
        return {success: false, message: "ERROR: Username NOT available"};
      } else {
        return {success: false, message: "ERROR: Username should be more than `6` characters"};
      }
    } else {
      return {success: false, message: "ERROR: Missing Parameter `username`."};
    }
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR"};
  }
});

exports.x_checkInviteCode = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  try {
    if (data.invite_code) {
      if ( Number(data.invite_code.length) == 5) {
        const res = await checkInviteCode(data.invite_code.toUpperCase());
        if (res) {
          return {success: true, message: "SUCCESS: Invite Code valid"};
        }
        return {success: false, message: "ERROR: Invite Code invalid"};
      } else {
        return {success: false, message: "ERROR: `invite_code` should be of `5` characters"};
      }
    } else {
      return {success: false, message: "ERROR: Missing Parameter `invite_code`."};
    }
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR"};
  }
});

exports.x_verifyInviteCode = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  try {
    return await verifyInviteCode(context);
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR"};
  }
});

exports.x_createUser = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  try {
    if (data.username && data.invite_code) {
      // TODO: Input Sanitsation.
      let _data: any = {
        username: data.username.replace("@", "").toLowerCase(),
        inviteCode: data.invite_code.toUpperCase(),
      };
      if (data.name) {
        _data = {
          username: data.username.replace("@", "").toLowerCase(),
          name: data.name,
          inviteCode: data.invite_code.toUpperCase(),
        };
      }
      // Call CreateUser Funciton
      const response = await createUser(
          context,
          _data
      );
      return response;
    } else {
      return {success: false, message: "ERROR: Missing one (or) parameter from `username`, `invite_code`."};
    }
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR!"};
  }
});

exports.x_linkTwitter = functions.https.onCall( async (_, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  try {
    return await linkTwitter(context);
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR!"};
  }
});

exports.x_linkGoogle = functions.https.onCall( async (_, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  try {
    return await linkGoogle(context);
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR!"};
  }
});

exports.x_linkEVMWallet = functions.https.onCall( async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (!data.evm_address) {
    return {success: false, message: "ERROR: Missing Parameter `evm_address`"};
  }
  if (data.evm_address == "") {
    return {success: false, message: "ERROR: Invalid parameter `evm_address` value"};
  }
  try {
    return await linkEVMWallet(context, data);
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR!"};
  }
});

exports.x_linkSOLWallet = functions.https.onCall( async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (!data.sol_address) {
    return {success: false, message: "ERROR: Missing Parameter `sol_address`"};
  }
  if (data.sol_address == "") {
    return {success: false, message: "ERROR: Invalid parameter `sol_address` value"};
  }
  try {
    return await linkSOLWallet(context, data);
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR!"};
  }
});

exports.x_updateImage = functions.https.onCall( async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (!data.image_url) {
    return {success: false, message: "ERROR: Missing parameter `image_url`"};
  }
  if (data.image_url == "") {
    return {success: false, message: "ERROR: Invalid parameter `image_url` value"};
  }
  try {
    return await updateImage(context, data);
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR!"};
  }
});

exports.x_updateName = functions.https.onCall( async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (!data.name) {
    return {success: false, message: "ERROR: Missing parameter `name`"};
  }
  if (data.name == "") {
    return {success: false, message: "ERROR: Invalid parameter `name` value"};
  }
  try {
    return await updateName(context, data);
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR!"};
  }
});

exports.x_createOrg = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  try {
    if (data.name && data.description && data.tags && data.website) {
      // Input Santisation
      if (data.tags.length != 0 && data.name.length > 2 && data.description.length > 26 && data.website.length != 0) {
        // Call CreateUser Funciton
        const response = await createOrg(
            context,
            data
        );
        return response;
      } else {
        return {success: false, message: "ERROR: One (or) more parameters inputs are Invalid!"};
      }
    } else {
      return {success: false, message: "ERROR: Missing one (or) more parameters from `name`,`description`, `tags`, `website`."};
    }
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR"};
  }
});

exports.x_createQuest = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  try {
    if (
      data.title &&
      data.tags &&
      data.cta_title &&
      data.description &&
      data.rewards_type &&
      data.reward &&
      data.actions &&
      data.expiry &&
      data.quest_day &&
      data.type
    ) {
      // TODO: Input Santisation
      if (!data.quest_day.includes("DAY")) {
        return {success: false, message: "ERROR: Invalid Parameter value : `quest_day`"};
      }
      try {
        if (typeof(data.launch_day_period) !== typeof(Number(0))) {
          return {success: false, message: "ERROR: `launch_day_period` should be a number."};
        }
        if (Number(data.launch_day_period) < 0) {
          return {success: false, message: "ERROR: Invalid Parameter value : `launch_day_period`"};
        }
      } catch (err) {
        return {success: false, message: "ERROR: Missing Parameter : `launch_day_period`"};
      }
      let _expiryDate;
      try {
        _expiryDate = new Date(data.expiry);
      } catch (err) {
        return {success: false, message: "ERROR: Invalid parameter value : `expiry`"};
      }
      if (
        Object.values(QuestType).includes(data.type.trim()) &&
        data.title.length != 0 &&
        data.tags.length != 0 &&
        data.cta_title.length != 0 &&
        data.description.length != 0 &&
        data.rewards_type.length != 0 &&
        data.reward.length != 0 &&
        data.actions.length != 0 &&
        _expiryDate.getTime() >= Date.now()
      ) {
        // Validate actions structure.
        let actionFlag = 0;
        for (let i=0; i < data.actions.length; i++) {
          const action = data.actions[i];
          if (validateActionStruct(action)) {
            actionFlag += 1;
          }
        }
        if (actionFlag != data.actions.length) {
          return {success: false, message: "ERROR: Invalid `action` object"};
        }
        // Call function here
        return await createQuest(context, data);
      } else {
        return {success: false, message: "ERROR: One (or) more parameters inputs are Invalid!"};
      }
    } else {
      return {success: false, message: "ERROR: Missing one (or) more parameters from `title`, `description`, `type`, `rewards_type`, `cta_title`, `tags`, `reward`, `expiry`, `launch_day_period` (or) `actions`."};
    }
  } catch (err) {
    console.error("Error", err);
    return {success: false, message: "ERROR"};
  }
});

exports.x_checkIfUserFollows = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (data.userId && data.userIdToFollow) {
    if (data.userId != "" && data.userIdToFollow) {
      const result = await checkIfUserFollows(data.userId, data.userIdToFollow);
      if (result) {
        return {success: true, message: "SUCCESS: Verification success!"};
      }
      return {success: false, message: "ERROR: Verification failed!"};
    }
    return {success: false, message: "ERROR: Invalid `userId` (or) `userIdToFollow`"};
  }
  return {success: false, message: "ERROR: One or more parameters missing `userId`, `userIdToFollow`"};
});

exports.x_checkIfUserLikedTweet = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (data.userId && data.tweetURL) {
    if (data.userId != "" && data.tweetURL) {
      const result = await checkIfUserLikedTweet(data.userId, data.tweetURL);
      if (result) {
        return {success: true, message: "SUCCESS: Verification success!"};
      }
      return {success: false, message: "ERROR: Verification failed!"};
    }
    return {success: false, message: "ERROR: Invalid `userId` (or) `tweetURL`"};
  }
  return {success: false, message: "ERROR: One or more parameters missing `userId`, `tweetURL`"};
});

exports.x_checkIfUserRetweeted = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (data.userId && data.tweetURL) {
    if (data.userId != "" && data.tweetURL) {
      const result = await checkIfUserRetweeted(data.userId, data.tweetURL);
      if (result) {
        return {success: true, message: "SUCCESS: Verification success!"};
      }
      return {success: false, message: "ERROR: Verification failed!"};
    }
    return {success: false, message: "ERROR: Invalid `userId` (or) `tweetURL`"};
  }
  return {success: false, message: "ERROR: One or more parameters missing `userId`, `tweetURL`"};
});

exports.x_checkIfUserCommented = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (data.userId && data.tweetURL) {
    if (data.userId != "" && data.tweetURL) {
      const result = await checkIfUserCommented(data.userId, data.tweetURL);
      if (result) {
        return {success: true, message: "SUCCESS: Verification success!"};
      }
      return {success: false, message: "ERROR: Verification failed!"};
    }
    return {success: false, message: "ERROR: Invalid `userId` (or) `tweetURL`"};
  }
  return {success: false, message: "ERROR: One or more parameters missing `userId`, `tweetURL`"};
});

exports.x_checkIfUserQuoted = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (data.userId && data.tweetURL) {
    if (data.userId != "" && data.tweetURL) {
      const result = await checkIfUserQuoted(data.userId, data.tweetURL);
      if (result) {
        return {success: true, message: "SUCCESS: Verification success!"};
      }
      return {success: false, message: "ERROR: Verification failed!"};
    }
    return {success: false, message: "ERROR: Invalid `userId` (or) `tweetURL`"};
  }
  return {success: false, message: "ERROR: One or more parameters missing `userId`, `tweetURL`"};
});

exports.x_generateInviteCode = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  return await generateInviteCode(context, data);
});

exports.x_registerForQuest = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (data.questId) {
    if (
      data.questId.length != 0
    ) {
      return await registerForQuest(context, data);
    }
    return {success: false, message: "ERROR: One (or) more parameters inputs are Invalid!"};
  }
  return {success: false, message: "ERROR: Missing one (or) more parameter `questId`"};
});

exports.x_completeAction = functions.https.onCall(async (data, context) => {
  // Check if it's an Authenticated User.
  if (!context.auth) {
    return {success: false, message: "ERROR: UnAuthorized."};
  }
  if (data.action_order_id) {
    if (
      data.action_order_id.length != 0
    ) {
      return await completeAction(context, data);
    }
    return {success: false, message: "ERROR: One (or) more parameters inputs are Invalid!"};
  }
  return {success: false, message: "ERROR: Missing parameter `action_order_id`"};
});

exports.x_registerAdminUser = functions.https.onCall(async (data, context) => {
  return await createAdmin();
});
