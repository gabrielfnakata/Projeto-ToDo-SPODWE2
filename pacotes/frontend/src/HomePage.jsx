import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import "./App.css";

export default function HomePage() {
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);
  const [listas, setListas] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const navigate = useNavigate();
  const trackRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filtroURL = params.get("filtro");
    if (filtroURL === "propria" || filtroURL === "compartilhada") {
      setFiltro(filtroURL);
    } else {
      setFiltro("todas");
    }
  }, [location.search]);

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

  const buscarListas = async () => {
    if (!token) return;
    try {
      const resProprias = await fetch("http://localhost:3000/listas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listasProprias = resProprias.ok ? await resProprias.json() : [];

      const resCompartilhadas = await fetch("http://localhost:3000/listas/compartilhadas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listasCompartilhadas = resCompartilhadas.ok ? await resCompartilhadas.json() : [];

      const todasListas = [
        ...(Array.isArray(listasProprias) ? listasProprias.map(l => ({ ...l, tipo: "propria" })) : []),
        ...(Array.isArray(listasCompartilhadas) ? listasCompartilhadas.map(l => ({ ...l, tipo: "compartilhada" })) : []),
      ];

      setListas(todasListas);
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
    // eslint-disable-next-line
  }, [usuario, location.pathname]);

  const scrollLeft = () => {
    trackRef.current?.scrollBy({ left: -trackRef.current.clientWidth, behavior: "smooth" });
  };
  const scrollRight = () => {
    trackRef.current?.scrollBy({ left: trackRef.current.clientWidth, behavior: "smooth" });
  };

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

  const listasFiltradas =
    filtro === "todas"
      ? listas
      : listas.filter((l) => l.tipo === filtro);

  return (
    <div className="homepage">
      <NavBar />

      <div className="carousel-wrapper">
        <button className="carousel-arrow left" onClick={scrollLeft}>‹</button>

        <div className="carousel-track" ref={trackRef}>
          <div
            className="todo-card add-card"
            onClick={() => navigate("/listas/create")}
          >
            <span className="add-icon">+</span>
          </div>

          {listasFiltradas.map((list) => (
            <div
              key={list.id}
              className="todo-card"
              onClick={() => navigate(`/todos?listId=${list.id}`)}
            >
              <h3>
                {list.nome}
              </h3>
              {list.tipo === "compartilhada" && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>(compartilhada)</div>
              )}
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