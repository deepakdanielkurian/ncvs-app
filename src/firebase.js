import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyD223Fms3H84sISqXSxErH62envmSOtrpk",
  authDomain:        "ncvs-donation-tracker.firebaseapp.com",
  projectId:         "ncvs-donation-tracker",
  storageBucket:     "ncvs-donation-tracker.firebasestorage.app",
  messagingSenderId: "124246167991",
  appId:             "1:124246167991:web:1fd74fa287b76abff99832"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export default app
