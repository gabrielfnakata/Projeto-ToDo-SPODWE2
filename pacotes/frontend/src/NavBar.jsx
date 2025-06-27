import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

export default function NavBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  
  const [usuario, setUsuario] = useState(null);

  const buscarUsuario = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      const response = await fetch('http://localhost:3000/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const dadosUsuario = await response.json();
        setUsuario(dadosUsuario);
      }
    }
    catch (err) {
      console.error('Erro ao buscar usuário:', err);
    }
  }

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
        <button className="nav-button">To-Dos Compartilhadas</button>
      </div>
      <div className="navbar-right">
        {usuario && <span>Olá, {usuario.nome}!</span>}
        <button className="nav-button" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
