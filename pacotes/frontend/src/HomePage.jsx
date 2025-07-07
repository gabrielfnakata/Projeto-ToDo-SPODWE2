// HomePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import "./App.css";

export default function HomePage({ shared = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const trackRef = useRef(null);

  const [usuario, setUsuario] = useState(null);
  const [listas, setListas]   = useState([]);

  const token = localStorage.getItem("token");

  // quantos cards serão visíveis (máx. 4)
  const listasCount = listas.length + 1; // +1 pro botão de adicionar
  const visible     = Math.min(listasCount, 4);

  // 1) Buscar dados do usuário
  useEffect(() => {
    async function fetchUser() {
      if (!token) {
        setUsuario(null);
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setUsuario(await res.json());
        } else {
          setUsuario(null);
        }
      } catch {
        setUsuario(null);
      }
    }
    fetchUser();
  }, [token]);

  // 2) Buscar listas quando usuário estiver definido
  useEffect(() => {
    async function fetchListas() {
      if (!token || !usuario) return;
      try {
        const endpoint = shared
          ? "http://localhost:3000/listas/compartilhadas"
          : "http://localhost:3000/listas";
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setListas(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchListas();
  }, [token, usuario, shared, location.pathname]);

  // Scroll do carrossel
  const scrollLeft = () => {
    trackRef.current?.scrollBy({
      left: -trackRef.current.clientWidth,
      behavior: "smooth",
    });
  };
  const scrollRight = () => {
    trackRef.current?.scrollBy({
      left: trackRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  // Se não estiver logado, mostra prompt de login
  if (!usuario) {
    return (
      <>
        <NavBar />
        <div className="login-prompt">
          <p>Você precisa estar logado para ver suas listas.</p>
          <button
            className="nav-button"
            onClick={() => navigate("/login")}
          >
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
        <button className="carousel-arrow left" onClick={scrollLeft}>
          ‹
        </button>

        <div
          className="carousel-track"
          ref={trackRef}
          style={{ "--visible": visible }}
        >
          {/* Botão de adicionar nova lista */}
          <div
            className="todo-card add-card"
            onClick={() => navigate("/listas/create")}
          >
            <span className="add-icon">+</span>
          </div>

          {/* Cards das listas existentes */}
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
                        todo.status.toLowerCase().includes("conclu")
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

        <button className="carousel-arrow right" onClick={scrollRight}>
          ›
        </button>
      </div>
    </div>
  );
}