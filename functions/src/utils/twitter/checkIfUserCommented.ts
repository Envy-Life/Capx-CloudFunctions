// import * as secrets from "../../secrets.json";
import axios from "axios";

export async function checkIfUserCommented(
    userId: string,
    tweetURL: string
) {
  try {
    // CHECKING IF USER COMMENTED ON TWEET
    // WILL NOT WORK IF USER'S TWEETS or COMPANY'S TWEETS ARE PRIVATE
    // TWITTER ALLOWS ACCESS ONLY TO LAST 7 DAYS OF DATA , SO THIS WILL NOT WORK FOR OLDER TWEETS
    let paginationToken = "-1";
    const tweetId = tweetURL.split("?")[0].split("/")[5];
    while (paginationToken != undefined) {
      const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
        headers: {
          Authorization: "Bearer " + "AAAAAAAAAAAAAAAAAAAAAFwWnAEAAAAACVTo7noRubRXkj%2BJBdKE9LK4u2k%3DWrf5iBihTTHUKAPcV2oQ2Snc2wuH6rZa9JtiC8Bg5F7o5SGmDs",
        },
        params: {
          "query": "in_reply_to_tweet_id:"+tweetId,
          "max_results": 100,
          "pagination_token": paginationToken == "-1" ? undefined : paginationToken,
          "tweet.fields": "author_id,referenced_tweets",
        },
      });
      console.log(response.data);
      for (let i = 0; i < response.data.data.length; i++) {
        if (response.data.data[i].author_id == userId) {
          console.log("User commented on tweet");
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

checkIfUserCommented("sharvilmalik", "https://twitter.com/advoc8e/status/1658046999596261376");
