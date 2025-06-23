import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:3000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao registrar.");
      }

      setSuccess("Registro concluído!");
      setNome("");
      setEmail("");
      setSenha("");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container">
      <div className="heading">Registre-se</div>
      {error && <div className="error-message">{error}</div>}
      {success && <div style={{ color: "green", textAlign: "center" }}>{success}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} type="text" className="input" required />
        <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input" required />
        <input placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} type="password" className="input" required />
        <span className="forgot-password">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
            Voltar para login
          </a>
        </span>
        <button type="submit" className="login-button">Criar conta</button>
      </form>
    </div>
  );
};

export default Register;
