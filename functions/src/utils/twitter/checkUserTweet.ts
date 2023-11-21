/* eslint-disable max-len */
import * as secrets from "../../secrets.json";
import axios from "axios";

export async function checkUserTweet(
    userId: string,
    tweetURL: string,
    toCheck: [string]
) {
  try {
    // CHECKING IF USER RETWEETED TWEET
    // WILL NOT WORK IF USER'S TWEETS or COMPANY'S TWEETS ARE PRIVATE
    const tweetId = tweetURL.split("?")[0].split("/")[5];
    const response = await axios.get("https://api.twitter.com/2/tweets/"+tweetId + "?expansions=author_id", {
      headers: {
        Authorization: "Bearer " + secrets.BEARER_TOKEN,
      },
    });
    if (response.data.data.author_id == userId) {
      for (let i = 0; i < toCheck.length; i++) {
        if (!response.data.data.text.includes(toCheck[i])) {
          return false;
        }
      }
      return true;
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}
