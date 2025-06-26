import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (!response.ok) throw new Error("Erro no login");

      const data = await response.json();
      localStorage.setItem("token", data.token); 
      navigate("/todos");
    } catch {
      setError("Email ou senha inválidos.");
    }
  };

  return (
    <div className="container">
      <div className="heading">Entrar</div>
      {error && <div className="error-message">{error}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input" required />
        <input placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} type="password" className="input" required />
        <span className="forgot-password">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>
            Registre-se
          </a>
        </span>
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default Login;
