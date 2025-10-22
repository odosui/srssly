import React from "react";
import { signup } from "../auth";
import { showToast } from "../lib/toast";

const SignupPage: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConf, setPasswordConf] = React.useState("");
  const [error, setError] = React.useState("");

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email === "" || password === "") {
      setError("Email and password are required");
      return;
    }

    if (password !== passwordConf) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    const { error: err } = await signup(email, password);
    if (!err) {
      showToast("You have successfully signed up!", "success");
      window.location.href = "/#/login";
    } else {
      setError(err);
    }
  };

  return (
    <div className="signup-page">
      <h1>Sign Up</h1>
      <div className="signup-form">
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
              autoFocus
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
          <div className="form-item">
            <input
              type="password"
              name="passwordConf"
              placeholder="Confirm Password"
              value={passwordConf}
              onChange={(e) => {
                setPasswordConf(e.target.value);
              }}
            />
          </div>
          <div className="form-item actions">
            <a href="/#/login">Login</a>
            <button type="submit">Sign Up</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
