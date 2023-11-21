/* eslint-disable max-len */
import * as secrets from "../../secrets.json";
import axios from "axios";

export async function checkIfUserLikedTweet(
    userId: string,
    tweetURL: string
) {
  try {
    // CHECKING IF USER LIKED TWEET
    // WILL NOT WORK IF USER'S TWEETS or COMPANY'S TWEETS ARE PRIVATE
    const paginationToken = "-1";
    const tweetId = tweetURL.split("?")[0].split("/")[5];
    const response = await axios.get("https://api.twitter.com/2/tweets/"+tweetId+"/liking_users", {
      headers: {
        Authorization: "Bearer " + secrets.BEARER_TOKEN,
      },
      params: {
        "max_results": 100,
        "pagination_token": paginationToken == "-1" ? undefined : paginationToken,
      },
    });
    for (let i = 0; i < response.data.data.length; i++) {
      if (response.data.data[i].id == userId) {
        console.log("User liked tweet");
        return true;
      }
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}
