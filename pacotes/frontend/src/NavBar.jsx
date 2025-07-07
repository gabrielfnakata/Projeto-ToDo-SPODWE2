// NavBar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

export default function NavBar() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  const buscarUsuario = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUsuario(null);
        return;
      }
      const response = await fetch("http://localhost:3000/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const dadosUsuario = await response.json();
        setUsuario(dadosUsuario);
      } else {
        setUsuario(null);
      }
    } catch (err) {
      console.error("Erro ao buscar usuário:", err);
      setUsuario(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUsuario(null);
    navigate("/login");
  };

  useEffect(() => {
    buscarUsuario();
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home">
          <img src="/imagens/bloco.png" alt="Logo" className="logo" />
        </Link>
        <Link to="/home">
          <button className="nav-button">Minhas To-Dos</button>
        </Link>
        <Link to="/homecompartilhadas">
          <button className="nav-button">To-Dos Compartilhadas</button>
        </Link>
      </div>

      <div className="navbar-right">
        {usuario ? (
          <>
            <span>Olá, {usuario.nome}!</span>
            <button className="nav-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">
            <button className="nav-button">Login</button>
          </Link>
        )}
      </div>
    </nav>
  );
}
