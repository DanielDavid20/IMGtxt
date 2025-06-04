import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC60wXeYsrMGA2CBrzWbDqy6scmJGSv72M",
    authDomain: "freelance-65d77.firebaseapp.com",
    projectId: "freelance-65d77",
    storageBucket: "freelance-65d77.firebasestorage.app",
    messagingSenderId: "240261092959",
    appId: "1:240261092959:web:7011e50263b4cda2e76dea"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc }; 