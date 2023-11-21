/* eslint-disable max-len */
import * as secrets from "../../secrets.json";
import axios from "axios";

export async function getUsernameFromId(
    userId: string
) {
  try {
    const response = await axios.get("https://api.twitter.com/2/users/" + userId, {
      headers: {
        Authorization: "Bearer " + secrets.BEARER_TOKEN,
      },
    });
    return response.data.data.username;
  } catch (err) {
    console.log("ERROR:", err);
    return "";
  }
}
