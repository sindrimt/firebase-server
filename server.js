const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");
const service = require("/etc/secrets/service.json");

const dotenv = require("dotenv");
dotenv.config();

const collectionName = "fundingPipsData";

// const service = {
//     type: "service_account",
//     project_id: "phantom-core-ai-6a238",
//     client_email: "firebase-adminsdk-hl76x@phantom-core-ai-6a238.iam.gserviceaccount.com",
//     client_id: "115999586882716618126",
//     auth_uri: "https://accounts.google.com/o/oauth2/auth",
//     token_uri: "https://oauth2.googleapis.com/token",
//     auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//     client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-hl76x%40phantom-core-ai-6a238.iam.gserviceaccount.com",
//     private_key: process.env.FIREBASE_PRIVATE_KEY,
//     private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//     universe_domain: "googleapis.com",
// };

// console.log(service);

admin.initializeApp({
    credential: admin.credential.cert(service),
});

const db = admin.firestore();

const app = express();
const port = process.env.PORT || 3001;
app.use(cors());

app.use(bodyParser.json());

app.post("/saveData", async (req, res) => {
    console.log("Got Data");
    try {
        const { userID, chatID, message, transcriptID } = req.body;

        await db.collection(collectionName).add({
            userID,
            chatID,
            message,
            transcriptID,
            timestamp: Date.now(), //serverTimestamp()
        });

        res.status(200).json({ success: true, message: "Data saved successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

app.post("/updateChatMessage", async (req, res) => {
    try {
        const { chatID, newMessage } = req.body;
        const fundingPipsDataRef = db.collection(collectionName);
        const querySnapshot = await fundingPipsDataRef.where("chatID", "==", chatID).get();

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await docRef.update({
                message: newMessage,
            });
            res.status(200).json({ success: true, message: "Chat updated successfully." });
        } else {
            res.status(404).json({ success: false, message: "No chat found with the given chatID." });
        }
    } catch (error) {
        console.error("Error updating chat message:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

app.post("/updateIntercomId", async (req, res) => {
    try {
        const { chatID, intercomId } = req.body;
        const fundingPipsDataRef = db.collection(collectionName);
        const querySnapshot = await fundingPipsDataRef.where("chatID", "==", chatID).get();

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await docRef.update({
                intercomId: intercomId,
            });
            res.status(200).json({ success: true, message: "Chat updated successfully." });
        } else {
            res.status(404).json({ success: false, message: "No chat found with the given chatID." });
        }
    } catch (error) {
        console.error("Error updating chat message:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

app.get("/fetchChatDetails", async (req, res) => {
    try {
        const userID = req.query.userID;
        const fundingPipsDataRef = db.collection(collectionName);
        const querySnapshot = await fundingPipsDataRef.where("userID", "==", userID).get();

        const userChatDetails = querySnapshot.docs.map((doc) => ({
            chatID: doc.data().chatID,
            message: doc.data().message,
            timestamp: doc.data().timestamp,
            transcriptID: doc.data().transcriptID,
            // Include other fields as necessary
        }));

        res.status(200).json({ success: true, data: userChatDetails });
    } catch (error) {
        console.error("Error fetching chat details:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

app.get("/fetchChat", async (req, res) => {
    try {
        const chatID = req.body.chatID;
        const fundingPipsDataRef = db.collection(collectionName);
        const querySnapshot = await fundingPipsDataRef.where("chatID", "==", chatID).get();

        const userChatDetails = querySnapshot.docs.map((doc) => ({
            chatID: doc.data().chatID,
            message: doc.data().message,
            timestamp: doc.data().timestamp,
            transcriptID: doc.data().transcriptID,
            // Include other fields as necessary
        }));

        res.status(200).json({ success: true, data: userChatDetails });
    } catch (error) {
        console.error("Error fetching chat details:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

app.delete("/deleteChatMessage", async (req, res) => {
    try {
        const { chatID } = req.body;
        const fundingPipsDataRef = db.collection(collectionName);
        const querySnapshot = await fundingPipsDataRef.where("chatID", "==", chatID).get();

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await docRef.delete();
            res.status(200).json({ success: true, message: "Chat deleted successfully." });
        } else {
            res.status(404).json({ success: false, message: "No chat found with the given chatID." });
        }
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
