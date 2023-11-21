import * as functions from "firebase-functions";
import axios from 'axios';
import * as secrets from "../secrets.json";


// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const discordCall = functions.https.onCall(async (data : any , context : functions.https.CallableContext) => {
    let token = context.rawRequest.rawHeaders[context.rawRequest.rawHeaders.findIndex((element : string) => element === "authorization") + 1]
    const resp = await axios.get(secrets.DISCORD_BASE_URL + data.callEndpoint , {
        params : data,
        headers : {
            "Authorization" : token
        }
    } )
    return resp.data;
})



