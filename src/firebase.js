import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyAiRlhirVBdSUPb0duk9eagmfqT2uX_BN8",
  authDomain:        "donation-tracker-f914e.firebaseapp.com",
  projectId:         "donation-tracker-f914e",
  storageBucket:     "donation-tracker-f914e.firebasestorage.app",
  messagingSenderId: "246871755891",
  appId:             "1:246871755891:web:91edd020299ac50193ae06"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export default app
