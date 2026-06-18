import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getDatabase } from "firebase-admin/database";
import dotenv from 'dotenv';
dotenv.config();

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  let rawKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!rawKey.includes("BEGIN PRIVATE KEY")) {
     rawKey = "-----BEGIN PRIVATE KEY-----" + (rawKey.startsWith("\\n") || rawKey.startsWith("\n") ? "" : "\\n") + rawKey;
  }
  const privateKeyFixed = rawKey.replace(/\\n/g, '\n');

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKeyFixed,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: "https://center-management-legislator-default-rtdb.europe-west1.firebasedatabase.app"
  });
  console.log("Initialized!");
}

async function check() {
  const db = getDatabase();
  const snap = await db.ref('/').once('value');
  const maxKeys = Object.keys(snap.val() || {});
  console.log("Root keys:", maxKeys);
  
  const users = await db.ref('users').once('value');
  console.log("Users exist?", users.exists());
  if (users.exists()) {
    console.log("Users:", Object.keys(users.val()));
    let hasTokens = false;
    users.forEach(u => {
        if (u.val().fcmToken) hasTokens = true;
    });
    console.log("Any user has fcmToken?", hasTokens);
  }
}
check().catch(console.error).then(() => process.exit(0));
