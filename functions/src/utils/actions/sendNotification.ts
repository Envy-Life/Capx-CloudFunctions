/* eslint-disable max-len */

import {NotifyType} from "../enums/notifyType";

export async function sendNotification(
    action: any,
    email: string
) {
  try {
    if (action?.notification_type == NotifyType.Affiliate) {
      // TODO: Implement send Notification Engine here.
      return true;
    } else if (action?.notification_type == NotifyType.Meme) {
      // TODO: Implement send Notification Engine here.
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}
