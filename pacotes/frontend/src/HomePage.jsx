import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import "./App.css";

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const [usuario, setUsuario]   = useState(null);
  const [listas, setListas]     = useState([]);
  const [filtro, setFiltro]     = useState("todas");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const f = params.get("filtro");
    if (f === "propria" || f === "compartilhada") setFiltro(f);
    else setFiltro("todas");
  }, [location.search]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUsuario(null);
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUsuario(await res.json());
        else setUsuario(null);
      } catch {
        setUsuario(null);
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    const fetchListas = async () => {
      if (!token || !usuario) return;
      try {
        const [resProprias, resComp] = await Promise.all([
          fetch("http://localhost:3000/listas", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/listas/compartilhadas", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const proprias = (resProprias.ok ? await resProprias.json() : []).map(l => ({ ...l, tipo: "propria" }));
        const compart = (resComp.ok ? await resComp.json()     : []).map(l => ({ ...l, tipo: "compartilhada" }));
        setListas([...proprias, ...compart]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchListas();
  }, [token, usuario]);

  const listasFiltradas =
    filtro === "todas"
      ? listas
      : listas.filter(l => l.tipo === filtro);

  const listasCount = listasFiltradas.length + 1;
  const visible     = Math.min(listasCount, 4);
  const scrollLeft  = () => trackRef.current?.scrollBy({ left: -trackRef.current.clientWidth, behavior: "smooth" });
  const scrollRight = () => trackRef.current?.scrollBy({ left:  trackRef.current.clientWidth, behavior: "smooth" });

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

  return (
    <div className="homepage">
      <NavBar />

      <div className="carousel-wrapper">
        <button className="carousel-arrow left"  onClick={scrollLeft}>‹</button>

        <div
          className="carousel-track"
          ref={trackRef}
          style={{ "--visible": visible }}
        >
          <div
            className="todo-card add-card"
            onClick={() => navigate("/listas/create")}
          >
            <span className="add-icon">+</span>
          </div>

          {listasFiltradas.map(list => (
            <div
              key={list.id}
              className="todo-card"
              onClick={() => navigate(`/todos?listId=${list.id}`)}
            >
              <h3>{list.nome}</h3>
              {list.tipo === "compartilhada" && (
                <div className= "compartilhada">
                  (compartilhada)
                </div>
              )}
              <ul className="card-todos-preview">
                {list.todosPreview?.length > 0 ? (
                  list.todosPreview.map(todo => (
                    <li
                      key={todo.id}
                      className={todo.status.toLowerCase().includes("conclu") ? "completed" : ""}
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