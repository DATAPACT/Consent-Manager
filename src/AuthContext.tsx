import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./firebase"; // Ensure Firebase utils are imported
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: { uid: string; displayName: string; role: string } | null; // Now includes role
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<{
    uid: string;
    displayName: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch the user's role and name from Firestore
          const ownerDoc = await getDoc(doc(db, "owners", currentUser.uid));
          const requesterDoc = await getDoc(
            doc(db, "requesters", currentUser.uid)
          );

          if (ownerDoc.exists()) {
            setUser({
              uid: currentUser.uid,
              displayName: ownerDoc.data().name, // Set the name from Firestore
              role: "owner", // Set the role as "owner"
            });
          } else if (requesterDoc.exists()) {
            setUser({
              uid: currentUser.uid,
              displayName: requesterDoc.data().name, // Set the name from Firestore
              role: "requester", // Set the role as "requester"
            });
          } else {
            setUser(null); // If not found in either collection, set user to null
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
          setUser(null); // Ensure that we reset user if fetching data fails
        }
      } else {
        setUser(null); // If no user is signed in
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null); // Clear the user when logging out
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
