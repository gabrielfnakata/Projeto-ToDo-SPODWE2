import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import NavBar from "./NavBar";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">
     <NavBar />
      <div className="todo-container">
        {["TODO 1", "TODO 2", "TODO 3"].map((titulo, i) => (
          <div
            key={i}
            className="todo-card"
            onClick={() => navigate("/todos")}
            style={{ cursor: "pointer" }}
          >
            <h2>{titulo}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

