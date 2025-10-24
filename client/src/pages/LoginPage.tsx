import React from "react";
import { login } from "../auth";

const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email === "" || password === "") {
      setError("Email and password are required");
      return;
    }
    setError("");
    const { error: err } = await login(email, password);

    if (err) {
      setError(err);
      return;
    }

    window.location.href = "/";
  };

  return (
    <div className="auth-page">
      <h1>Login</h1>
      <div className="login-form">
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleFormSubmit}>
          <div className="form-item">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </div>
          <div className="form-item">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>
          <div className="form-item actions">
            <a href="/#/signup">Sign Up</a>
            <button type="submit">Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
