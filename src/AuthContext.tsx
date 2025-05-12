import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase"; // Adjust the path as needed

// --- Define user profile type from Firestore ---
interface FirestoreUserProfile {
  name: string;
  email?: string;
  [key: string]: any; // Allow extra fields if needed
}

// --- Define context type ---
interface AuthContextType {
  user: User | null;
  role: string | null;
  userData: FirestoreUserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// --- Create context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Hook to use context ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// --- Props type for provider ---
interface AuthProviderProps {
  children: ReactNode;
}

// --- AuthProvider component ---
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<FirestoreUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await fetchUserRoleAndData(currentUser.uid);
      } else {
        setRole(null);
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchUserRoleAndData = async (uid: string) => {
    try {
      const ownerRef = doc(db, "owners", uid);
      const ownerSnap = await getDoc(ownerRef);

      if (ownerSnap.exists()) {
        setRole("owner");
        setUserData(ownerSnap.data() as FirestoreUserProfile);
        return;
      }

      const requesterRef = doc(db, "requesters", uid);
      const requesterSnap = await getDoc(requesterRef);

      if (requesterSnap.exists()) {
        setRole("requester");
        setUserData(requesterSnap.data() as FirestoreUserProfile);
        return;
      }

      setRole(null);
      setUserData(null);
    } catch (err) {
      console.error("Failed to fetch role and user data:", err);
      setRole(null);
      setUserData(null);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    setUser(result.user);
    await fetchUserRoleAndData(result.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    setUserData(null);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, role, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
