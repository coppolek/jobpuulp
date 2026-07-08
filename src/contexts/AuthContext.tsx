import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error && (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user'))) {
        console.warn('Sign-in popup was closed by the user.');
        return;
      }
      if (error && (error.code === 'auth/cancelled-popup-request' || error.message?.includes('cancelled-popup-request'))) {
        console.warn('Sign-in popup request was cancelled.');
        return;
      }
      if (error && (error.code === 'auth/popup-blocked' || error.message?.includes('popup'))) {
        alert('Il popup di accesso è stato bloccato. Per favore, apri l\'app in una nuova scheda cliccando l\'icona in alto a destra, o consenti i popup per questo sito.');
        return;
      }
      if (error && error.code === 'auth/unauthorized-domain') {
        alert('Il dominio non è autorizzato per la registrazione con Google. Prova ad aprire l\'app in una nuova scheda o contatta l\'amministratore.');
        return;
      }
      console.error('Authentication error:', error);
      alert('Errore durante l\'accesso: ' + error.message + '. Se sei in anteprima, prova ad aprire in una nuova finestra.');
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
