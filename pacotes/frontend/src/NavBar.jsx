import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

export default function NavBar() {
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
        <button className="nav-button">Logout</button>
      </div>
    </nav>
  );
}
