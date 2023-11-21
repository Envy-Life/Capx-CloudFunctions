/* eslint-disable max-len */
import * as secrets from "../../secrets.json";
import axios from "axios";

export async function checkIfUserQuoted(
    userId: string,
    tweetURL: string
) {
  try {
    // CHECKING IF USER QUOTED TWEET
    // WILL NOT WORK IF USER'S TWEETS or COMPANY'S TWEETS ARE PRIVATE
    let paginationToken = "-1";
    const tweetId = tweetURL.split("?")[0].split("/")[5];
    while (paginationToken != undefined) {
      const response = await axios.get("https://api.twitter.com/2/tweets/"+tweetId+"/quoted_tweets", {
        headers: {
          Authorization: "Bearer " + secrets.BEARER_TOKEN,
        },
        params: {
          "max_results": 100,
          "pagination_token": paginationToken == "-1" ? undefined : paginationToken,
          "tweet.fields": "author_id",
        },
      });
      for (let i = 0; i < response.data.data.length; i++) {
        if (response.data.data[i].author_id == userId) {
          console.log("User Quoted the tweet");
          return true;
        }
      }
      paginationToken = response.data.meta.next_token;
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}
