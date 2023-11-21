const functions = require('@google-cloud/functions-framework');
const Firestore = require('@google-cloud/firestore');
const PROJECTID = 'capx-alpha-test';
const COLLECTION_NAME = 'discord test 1';

const firestore = new Firestore({
    projectId: PROJECTID,
    timestampsInSnapshots: true
});

functions.http('discordDBHandler', async (req, res) => {
    let eventType = req.body.eventType;
    switch (eventType) {
        case 'voiceUserJoined':
            await discordVoiceUserJoinedEventHandler(req,res);
            break;
        case 'voiceUserLeft':
            await discordVoiceUserLeftEventHandler(req,res);
            break;
        case 'checkUserAttendedEvent':
            await userAttendanceChecker(req,res);
            break;
        default:
            res.status(400).send('Bad Request');
    }
});

async function userAttendanceChecker(req,res) {
    let eventId = req.body.eventId;
    let userId = req.body.userId;

    let docRef = firestore.collection(COLLECTION_NAME).doc(eventId);
    let eventExistence = await docRef.get()
    if (!eventExistence.exists) {
        return res.status(200).send({
            "result" : false,
        });
    }
    let eventRef = eventExistence.data();
    if (eventRef.userData.hasOwnProperty(userId)) {
        return res.status(200).send({
            "result" : true,
        });
    } else {
        return res.status(200).send({
            "result" : false,
        });
    }
}


async function discordVoiceUserJoinedEventHandler(req,res) {
    let eventId = req.body.eventId;
    let userId = req.body.userId;
    let timeStamp = req.body.timeStamp;

    let docRef = firestore.collection(COLLECTION_NAME).doc(eventId);
    let eventExistence = await docRef.get()
    if (!eventExistence.exists) {
        let temp = {
            eventId: eventId,
            eventData : req.body.eventData,
            userData : {}
        }
        temp.userData[userId] = {
            "joiningTimeStamps" : [timeStamp],
            "leavingTimeStamps" : []
        }
        await docRef.set(temp)
        return res.status(200).send('Success');
    }
    let eventRef = eventExistence.data();
    if (eventRef.userData.hasOwnProperty(userId)) {
        docRef.update({
            [`userData.${userId}.joiningTimeStamps`]: Firestore.FieldValue.arrayUnion(timeStamp)
        })
    } else {
        docRef.update({
            [`userData.${userId}`]: {
                "joiningTimeStamps" : [timeStamp],
                "leavingTimeStamps" : []
            }
        })
    }
    res.status(200).send('Success');

}

async function discordVoiceUserLeftEventHandler(req,res) {
    let eventId = req.body.eventId;
    let userId = req.body.userId;
    let timeStamp = req.body.timeStamp;

    let docRef = firestore.collection(COLLECTION_NAME).doc(eventId);
    let eventExistence = await docRef.get()
    if (!eventExistence.exists) {
        let temp = {
            eventId: eventId,
            eventData : req.body.eventData,
            userData : {}
        }
        temp.userData[userId] = {
            "joiningTimeStamps" : [],
            "leavingTimeStamps" : [timeStamp]
        }
        await docRef.set(temp)
        return res.status(200).send('Success');
    }
    let eventRef = eventExistence.data();
    if (eventRef.userData.hasOwnProperty(userId)) {
        docRef.update({
            [`userData.${userId}.leavingTimeStamps`]: Firestore.FieldValue.arrayUnion(timeStamp)
        })
    } else {
        docRef.update({
            [`userData.${userId}`]: {
                "joiningTimeStamps" : [],
                "leavingTimeStamps" : [timeStamp]
            }
        })
    }
    res.status(200).send('Success');
}