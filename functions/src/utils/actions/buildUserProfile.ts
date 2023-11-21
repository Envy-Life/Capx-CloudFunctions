/* eslint-disable max-len */

import {CallableContext} from "firebase-functions/v1/https";
import {ProfileUpdateType} from "../enums/profileUpdateType";
import {linkTwitter} from "../users/linkTwitter";
import {updateImage} from "../users/updateImage";
import {updateName} from "../users/updateName";

export async function buildUserProfile(
    action: any,
    context: CallableContext,
    data: any
) {
  try {
    if (action.verification_engine === ProfileUpdateType.FullName) {
      return await updateName(context, data);
    } else if (action.verification_engine === ProfileUpdateType.ProfileImage) {
      return await updateImage(context, data);
    } else if (action.verification_engine === ProfileUpdateType.LinkTwitter) {
      return await linkTwitter(context);
    } else if (action.verification_engine === ProfileUpdateType.LinkDiscord) {
      return {success: true};
    }
    return {success: false};
  } catch (err) {
    console.error(err);
    return {success: false};
  }
}
