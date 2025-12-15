import React, { useState } from "react";
import axios from "axios";

interface User {
  _id: string;
  name: string;
  username_email: string;
  type: "consumer" | "provider";
}

const UserDetails: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenValue, setTokenValue] = useState("");

  const showToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      setTokenValue(token);
      setTokenVisible(true);
    } else {
      setTokenValue("No token found in localStorage.");
      setTokenVisible(true);
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    setError("");
    setUser(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found.");
      setLoading(false);
      return;
    }

    try {
      const url = userId
        ? `https://dips.soton.ac.uk/negotiation-api/user/details/?user_id=${userId}`
        : `https://dips.soton.ac.uk/negotiation-api/user/details/`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Using token:", token);
      console.log("Request URL:", url);

      setUser(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch user details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="mb-3">
        <button className="btn btn-secondary" onClick={showToken}>
          Show My Token
        </button>
        {tokenVisible && (
          <pre
            className="mt-2 bg-light p-2 border rounded"
            style={{ wordBreak: "break-all" }}
          >
            {tokenValue}
          </pre>
        )}
      </div>

      <h4>Fetch User Details</h4>

      <div className="input-group mb-3 mt-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter user ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button className="btn btn-primary" onClick={fetchDetails}>
          Fetch
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-danger">{error}</p>}

      {user && (
        <ul className="list-group mt-3">
          <li className="list-group-item">
            <strong>Name:</strong> {user.name}
          </li>
          <li className="list-group-item">
            <strong>Email:</strong> {user.username_email}
          </li>
          <li className="list-group-item">
            <strong>Type:</strong> {user.type}
          </li>
          <li className="list-group-item">
            <strong>ID:</strong> {user._id}
          </li>
        </ul>
      )}
    </div>
  );
};

export default UserDetails;
