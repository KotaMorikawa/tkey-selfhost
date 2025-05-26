"use client";

import { useState } from "react";
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  UserCredential,
  OAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

export const useFirebaseAuth = () => {
  const [googleDriveAuthenticated, setGoogleDriveAuthenticated] =
    useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
    null
  );
  const [googleDriveFileId, setGoogleDriveFileId] = useState<string | null>(
    null
  );

  const app = initializeApp(firebaseConfig);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const auth = getAuth(app);
      const googleProvider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, googleProvider);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const authenticateWithGoogleDrive = async (): Promise<string | null> => {
    try {
      const auth = getAuth(app);
      const provider = new OAuthProvider("google.com");
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      const result = await signInWithPopup(auth, provider);
      const credential = OAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        setGoogleDriveAuthenticated(true);
        return credential.accessToken;
      } else {
        setGoogleDriveAuthenticated(false);
        setGoogleAccessToken(null);
        return null;
      }
    } catch (error) {
      setGoogleDriveAuthenticated(false);
      setGoogleAccessToken(null);
      throw error;
    }
  };

  return {
    // State
    googleDriveAuthenticated,
    googleAccessToken,
    googleDriveFileId,
    setGoogleDriveFileId,

    // Functions
    signInWithGoogle,
    authenticateWithGoogleDrive,
  };
};
