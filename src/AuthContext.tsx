import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { login as apiLogin, logout as apiLogout } from "./services/api";

// --- Define user profile type ---
interface UserProfile {
  name: string;
  email?: string;
  [key: string]: any; // Allow extra fields if needed
}

// --- Define user type ---
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  userData: UserProfile;
  apiToken?: string;
  loginSource?: "UI" | "External/API";
}

// --- Define context type ---
interface AuthContextType {
  user: AuthUser | null;
  role: string | null;
  userData: UserProfile | null;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage) or URL parameters
    const checkAuthState = async () => {
      // First check for URL parameters (from iframe auth)
      const urlParams = new URLSearchParams(window.location.search);
      const authUser = urlParams.get("auth_user");
      const authToken = urlParams.get("auth_token");

      if (authUser && authToken) {
        try {
          console.log("Found auth parameters in URL, setting localStorage...");
          const parsedUser = JSON.parse(decodeURIComponent(authUser));
          const decodedToken = decodeURIComponent(authToken);

          // Extract access_token if decodedToken is a JSON object string
          let tokenToStore = decodedToken;
          try {
            const tokenObject = JSON.parse(decodedToken);
            if (tokenObject.access_token) {
              tokenToStore = tokenObject.access_token;
            }
          } catch (e) {
            // Not JSON, use as-is
          }

          // Store in localStorage
          localStorage.setItem("user", JSON.stringify(parsedUser));
          localStorage.setItem("token", tokenToStore);

          // Set in context
          setUser(parsedUser);
          setRole(parsedUser.role);
          setUserData(parsedUser.userData);

          console.log("Authentication set from URL parameters:", parsedUser);

          // Clean up URL parameters but preserve mode parameter
          const mode = urlParams.get("mode");
          let newUrl = window.location.pathname;
          if (mode) {
            newUrl += `?mode=${mode}`;
          }
          window.history.replaceState({}, document.title, newUrl);

          setLoading(false);
          return;
        } catch (err) {
          console.error("Error parsing auth parameters:", err);
        }
      }

      // Fallback to localStorage check
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRole(parsedUser.role);
          setUserData(parsedUser.userData);
        } catch (err) {
          console.error("Error parsing stored user:", err);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }

      setLoading(false);
    };

    checkAuthState();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Use Express API for login
      const result = await apiLogin(email, password);

      if (result.success) {
        const authUser: AuthUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          role: result.user.role,
          userData: result.user.userData,
          apiToken: result.user.apiToken,
          loginSource: result.user.loginSource,
        };

        setUser(authUser);
        setRole(result.user.role);
        setUserData(result.user.userData);

        // Store in localStorage for persistence
        localStorage.setItem("user", JSON.stringify(authUser));
        if (result.user.apiToken) {
          // Extract access_token if apiToken is an object
          let token;
          if (
            typeof result.user.apiToken === "object" &&
            result.user.apiToken.access_token
          ) {
            token = result.user.apiToken.access_token;
            console.log("✅ Extracted access_token from apiToken object");
          } else {
            token = result.user.apiToken;
            console.log("⚠️ Using apiToken as-is (not an object)");
          }
          console.log(
            "📝 Storing token in localStorage:",
            token.substring(0, 50) + "..."
          );
          localStorage.setItem("token", token);
        }
      } else {
        throw new Error(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear state and localStorage regardless of API call success
      setUser(null);
      setRole(null);
      setUserData(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, role, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
