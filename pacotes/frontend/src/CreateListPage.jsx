import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "./App.css";

export default function CreateListPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [listName, setListName] = useState("");
  const [editorEmails, setEditorEmails] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    const emails = editorEmails
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (!listName.trim()) {
      setError("O nome da lista é obrigatório.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/listas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: listName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Falha ao criar lista");
      }
      
      const list = await res.json();
      navigate(`/todos?listId=${list.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <>
      <NavBar />
      <div className="todos-page">
        <div className="todos-card form-card">
          <h1 className="todos-header">Nova Lista de To-Dos</h1>
          {error && <p className="form-error">{error}</p>}
          <form className="create-list-form" onSubmit={handleSubmit}>
            <label className="form-label">
              Nome da Lista
              <input
                className="form-input"
                type="text"
                value={listName}
                onChange={e => setListName(e.target.value)}
                placeholder="Ex: Compras de Mercado"
                required
              />
            </label>

            <label className="form-label">
              E-mails que podem editar
              <input
                className="form-input"
                type="text"
                value={editorEmails}
                onChange={e => setEditorEmails(e.target.value)}
                placeholder="Ex: Ciclano@gmail.com"
              />
              <small className="form-help">
                Insira e-mails separados por vírgula
              </small>
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </button>

              <button type="submit" className="btn-primary">
                Criar Lista
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
