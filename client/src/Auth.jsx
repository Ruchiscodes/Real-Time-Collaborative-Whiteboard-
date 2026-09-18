import { useState } from "react";
import { authApi } from "./api";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault(); setError("");
    try {
      const data = mode === "login"
        ? await authApi.login(form.email, form.password)
        : await authApi.register(form.email, form.password, form.name);
      localStorage.setItem("collabboard_token", data.token);
      localStorage.setItem("collabboard_user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (err) { setError(err.message); }
  }

  return <main className="auth-page">
    <form className="auth-card" onSubmit={submit}>
      <div className="brand">✦ CollabBoard</div>
      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p>Collaborate on a canvas in real time.</p>
      {mode === "register" && <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />}
      <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
      <input type="password" placeholder="Password (8+ characters)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength="8" required />
      {error && <div className="error">{error}</div>}
      <button className="primary" type="submit">{mode === "login" ? "Sign in" : "Sign up"}</button>
      <button className="link-button" type="button" onClick={()=>setMode(mode==="login"?"register":"login")}>
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  </main>;
}
