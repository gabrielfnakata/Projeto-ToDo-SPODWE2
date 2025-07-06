// HomePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "./App.css";

export default function HomePage() {
  const [usuario, setUsuario] = useState(null);
  const [listas, setListas] = useState([]);
  const navigate = useNavigate();
  const trackRef = useRef(null);

  const token = localStorage.getItem("token");

  // 1) Buscar dados do usuário (verifica se está logado)
  const buscarUsuario = async () => {
    if (!token) {
      setUsuario(null);
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsuario(data);
      } else {
        setUsuario(null);
      }
    } catch {
      setUsuario(null);
    }
  };

  // 2) Buscar listas somente quando o usuário estiver logado
  const buscarListas = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/listas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setListas(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    buscarUsuario();
  }, []);

  useEffect(() => {
    if (usuario) {
      buscarListas();
    }
  }, [usuario]);

  // Scroll do carrossel
  const scrollLeft = () => {
    trackRef.current?.scrollBy({ left: -trackRef.current.clientWidth, behavior: "smooth" });
  };
  const scrollRight = () => {
    trackRef.current?.scrollBy({ left: trackRef.current.clientWidth, behavior: "smooth" });
  };

  // Se não estiver logado, mostra prompt de login
  if (!usuario) {
    return (
      <>
        <NavBar />
        <div className="login-prompt">
          <p>Você precisa estar logado para ver suas listas.</p>
          <button className="nav-button" onClick={() => navigate("/login")}>
            Fazer Login
          </button>
        </div>
      </>
    );
  }

  // Usuário logado: exibe o carrossel
  return (
    <div className="homepage">
      <NavBar />

      <div className="carousel-wrapper">
        <button className="carousel-arrow left" onClick={scrollLeft}>‹</button>

        <div className="carousel-track" ref={trackRef}>
          {/* Card de adicionar nova lista */}
          <div
            className="todo-card add-card"
            onClick={() => navigate("/listas/create")}
          >
            <span className="add-icon">+</span>
          </div>

         {listas.map((list) => (
  <div
    key={list.id}
    className="todo-card"
    onClick={() => navigate(`/todos?listId=${list.id}`)}
  >
    <h3>{list.nome}</h3>
    <ul className="card-todos-preview">
      {list.todosPreview?.length > 0 ? (
        list.todosPreview.map((todo) => (
          <li
            key={todo.id}
            className={
              String(todo.status || "")
                .toLowerCase()
                .includes("conclu")
                ? "completed"
                : ""
            }
          >
            {todo.texto}
          </li>
        ))
      ) : (
        <li className="empty">Nenhum item ainda</li>
      )}
    </ul>
  </div>
))}

        </div>

        <button className="carousel-arrow right" onClick={scrollRight}>›</button>
      </div>
    </div>
  );
}
