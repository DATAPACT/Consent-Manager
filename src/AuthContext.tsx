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
    // 1. Firebase login
    const result = await signInWithEmailAndPassword(auth, email, password);
    setUser(result.user);

    // 2. Firestore fallback for role (optional if using user_type from API)
    await fetchUserRoleAndData(result.user.uid);

    // 3. API login
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await fetch(
        "https://dips.soton.ac.uk/negotiation-api/user/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      if (!res.ok) {
        throw new Error("API login failed");
      }

      const data = await res.json(); // ✅ API returns a JSON object

      // ✅ Store just the token string
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_type", data.user_type); // e.g. "provider"

      // Optional: set the role based on API response instead of Firestore
      setRole(data.user_type);
    } catch (err) {
      console.error("Failed to login to API:", err);
      await signOut(auth); // logout Firebase too
      throw err;
    }
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
