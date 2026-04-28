// Demo Firebase project (isolated from production `kapetanova-kuca-waitlist`).
// Web SDK keys are public-by-design — security comes from firestore.rules.
const firebaseConfig = {
  apiKey:            "AIzaSyCJf37EN3a5zTOnI2mfHsmx0zPmGhwUhL8",
  authDomain:        "kapetanova-kuca-v2.firebaseapp.com",
  projectId:         "kapetanova-kuca-v2",
  storageBucket:     "kapetanova-kuca-v2.firebasestorage.app",
  messagingSenderId: "513251943219",
  appId:             "1:513251943219:web:4eceda28c8d359a5525446"
};

firebase.initializeApp(firebaseConfig);
