// src/components/UserList.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

interface User {
  _id: string;
  username_email: string;
  role: string;
}

const AllUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
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
        console.error(err);
        setError("Failed to fetch users.");
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
      <Link to="/">Go to home</Link>
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

export default AllUsers;
