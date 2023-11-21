const express = require('express');
const app = express();
const port = 3000;
const jwt_decode = require('jwt-decode');
const  axios = require('axios');
import {auth, db} from "../init/init";
import {exportSecret} from "../config/config";
const { createHash, createHmac } = require('crypto')

function verifyTelegramDataValidity ({ hash, ...data }) {
    let secrets: any = exportSecret();
    const secret = createHash('sha256')
      .update(secrets.FULL_BOT_ID)
      .digest()
    const checkString = Object.keys(data)
      .sort()
      .map(k => `${k}=${data[k]}`)
      .join('\n')
    const hmac = createHmac('sha256', secret)
      .update(checkString)
      .digest('hex')
    return hmac === hash
  }

async function authVerify(req, res) {
    try {
        let secrets: any = await exportSecret();
        if (req.headers.authorization == undefined) {
            console.log(1);
            res.status(403).send({
                "error" : "Not Authorized"
            });
            return false;
        } else {
            req.headers.authorization = req.headers.authorization.split(" ")[1];
            let headers = jwt_decode(req.headers.authorization , {header: true});
            let payload = jwt_decode(req.headers.authorization);
            
            if (headers.alg != "RS256") {
                console.log(2);
                res.status(403).send({
                    "error" : "Not Authorized"
                });
                return false;
            }
            let resp = await axios.get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com")
            if (resp.data[headers.kid] == undefined) {
                console.log(3);
                res.status(403).send({
                    "error" : "Not Authorized"
                });
                return false;
            }
            // TODO : UNCOMMENT BEFORE DEPLOYMENT
            if (payload.exp > Date.now() && payload.iat < Date.now()) {
                console.log(4);
                res.status(403).send({
                "error" : "Not Authorized"
            });
                return false;
            }
            if (secrets.authNames.indexOf(payload.aud) == undefined) {
                console.log(5);
                res.status(403).send({
                    "error" : "Not Authorized"
                });
                return false;
            }
            if (secrets.authNames.map(x => "https://securetoken.google.com/" + x).indexOf(payload.iss) == undefined) {
                console.log(6);
                res.status(403).send({
                    "error" : "Not Authorized"
                });
                return false;
            }
            return payload.user_id;
        }
    } catch (error) {
        console.log(7);
        console.log(error);
        res.status(403).send({
            "error" : "Not Authorized"
        });
        return false
    }
}

async function storeTGData(authres,decoded) {
    try {
        let docRef = db.collection('xtgdata').doc(authres);
        await docRef.set(decoded);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

app.get('/', (req, res) => {
    res.send("Server is running");
    })

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    })

app.get('/auth' , async (req, res) => {
    try {
        const secrets: any = await exportSecret();
        res.redirect("https://oauth.telegram.org/auth?bot_id="+ secrets.BOT_ID +"&origin=http%3A%2F%2F127.0.0.1%3A3000%2Fauth%2F&return_to=http%3A%2F%2F127.0.0.1%3A3000%2FauthHandler")
    } catch (error) {
        res.status(500).send({
            "success" : false,
            "message" : "Internal Server Error",
            "error" : "Internal server error" + error.message
        })        
    }
})

app.get('/authHandler' , async (req, res) => {
    try {
        let authres = await authVerify(req, res);
        if (authres == false) {
            return;
        }
        let decoded = jwt_decode(req.query.tgAuthResult, { header: true });
        let tgAuthRes = await verifyTelegramDataValidity(decoded);
        if (tgAuthRes == false) {
            res.status(403).send({
                "error" : "Not Authorized"
            });
            return;
        }
        await storeTGData(authres,decoded);
        // firebase
        // collection - xtgdata
        // document.id = authres
        // document.data = decoded
        res.send("User Authenticated Successfully")
        return;
    } catch (error) {
        res.status(500).send({
            "success" : false,
            "message" : "Internal Server Error",
            "error" : "Internal server error" + error.message
        })        
    }
})

//https://oauth.telegram.org/auth?bot_id=547043436&origin=https%3A%2F%2Fcore.telegram.org&embed=1&request_access=write&return_to=https%3A%2F%2Fcore.telegram.org%2Fwidgets%2Flogin