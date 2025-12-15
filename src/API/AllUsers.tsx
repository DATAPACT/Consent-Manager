// src/components/UserList.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

interface User {
  _id: string;
  username_email: string;
  role: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");

      if (!token || typeof token !== "string") {
        console.error("No token found or token is not a string");
        setError("Not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("Using token:", token); // ✅ Must show full JWT

      try {
        const res = await axios.get(
          "https://dips.soton.ac.uk/negotiation-api/users_list",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUsers(res.data);
      } catch (err: any) {
        console.error("Error response:", err.response?.data || err);
        if (err.response?.status === 401) {
          setError("Unauthorized. You don't have access to this resource.");
        } else {
          setError("Failed to fetch users.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mt-4">
      <h4>All Users</h4>
      <ul className="list-group mt-3">
        {users.map((user) => (
          <li key={user._id} className="list-group-item">
            <strong>{user.username_email}</strong> ({user.role})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
