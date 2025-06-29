import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "./App.css";

export default function HomePage() {
  const [listas, setListas] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const trackRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:3000/listas", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Não foi possível carregar listas");
        return res.json();
      })
      .then(setListas)
      .catch(console.error);
  }, [token]);

  const scrollLeft = () => {
    const track = trackRef.current;
    if (track) {
      track.scrollBy({ left: -track.clientWidth, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const track = trackRef.current;
    if (track) {
      track.scrollBy({ left: track.clientWidth, behavior: "smooth" });
    }
  };

  return (
    <div className="homepage">
      <NavBar />

      <div className="carousel-wrapper">
        <button className="carousel-arrow left" onClick={scrollLeft}>
          ‹
        </button>

        <div className="carousel-track" ref={trackRef}>
          <div
            className="todo-card add-card"
            onClick={() => navigate("/listas/create")}
          >
            <span className="add-icon">+</span>
          </div>

          {listas.map(list => (
            <div
              key={list.idLista}
              className="todo-card"
              onClick={() =>
                navigate(`/todos?listId=${encodeURIComponent(list.idLista)}`)
              }
            >
              <h3>{list.nome}</h3>
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
