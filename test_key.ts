import dotenv from 'dotenv';
dotenv.config();

console.log("Key defined?", !!process.env.FIREBASE_PRIVATE_KEY);
if (process.env.FIREBASE_PRIVATE_KEY) {
  const p = process.env.FIREBASE_PRIVATE_KEY;
  console.log("Starts with:", p.substring(0, 40));
  console.log("Ends with:", p.substring(p.length - 30));
  console.log("Has actual newlines?", p.includes('\n'));
  console.log("Has escaped newlines?", p.includes('\\n'));
}
