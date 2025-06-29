import { useState, useEffect } from "react";
import NavBar from "./NavBar";
import { useLocation } from "react-router-dom";

const useAuth = () => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });

  const login = async (email, senha) => {
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, senha }),
      });
      if (!response.ok) throw new Error('Login falhou');
      const data = await response.json();
      setToken(data.token);
      localStorage.setItem("token", data.token); 
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  return { token, login };
};

const AddTodo = ({ token, fetchTodos, listId }) => {
  const [texto, setTexto] = useState("");
  const [tags, setTags] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!listId) return;
    const textoTrim = texto.trim();
    const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t.length > 0);

    if (textoTrim && listId) {
      await fetch("http://localhost:3000/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          texto: textoTrim,
          data_criacao: new Date().toISOString(),
          data_vencimento: dataVencimento ? new Date(dataVencimento).toISOString() : null,
          tags: tagsArray,
          id_lista: listId,
        }),
      });
      setTexto("");
      setTags("");
      setDataVencimento("");
      if (fetchTodos) fetchTodos();
    }
  };

  return (
    <form className="add-todo-form" onSubmit={handleAdd}>
      <input
        className="add-todo-input"
        type="text"
        placeholder="Adicione uma tarefa"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={!listId}
      />
      <input
        className="add-todo-input"
        type="text"
        placeholder="Adicione uma tag"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        disabled={!listId}
      />
      <input
        className="add-todo-input"
        type="date"
        value={dataVencimento}
        onChange={(e) => setDataVencimento(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        disabled={!listId}
      />
      <button className="add-todo-button" type="submit" disabled={!listId}>
        Confirmar
      </button>
    </form>
  );
};

const TodoFilter = ({ setFilter, setTagFilter, tagsDisponiveis }) => {
  const [tag, setTag] = useState("");

  const handleFilterClick = (e) => {
    e.preventDefault();
    const f = e.target.id.replace("filter-", "");
    setFilter(f);
    setTagFilter("");
  };

  const handleTagChange = (e) => {
    setTag(e.target.value);
    setTagFilter(e.target.value);
    setFilter("tag");
  };

  return (
    <div className="todo-filter">
      <button id="filter-all" onClick={handleFilterClick}>Todos os Itens</button>
      <button id="filter-done" onClick={handleFilterClick}>Concluídos</button>
      <button id="filter-pending" onClick={handleFilterClick}>Pendentes</button>
      <button id="filter-em andamento" onClick={handleFilterClick}>Em andamento</button>
      <select className="filter-select" value={tag} onChange={handleTagChange}>
        <option value="">Tags ▾</option>
        {tagsDisponiveis.map((t,i) => (
          <option key={i} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
};

const TodoItem = ({ todo, markTodoAsDone, updateTodoStatus }) => {
  const formataData = (data) => {
    const dataSeparada = data.split("T")[0].split("-");
    return `${dataSeparada[2]}/${dataSeparada[1]}/${dataSeparada[0]}`
  };

  return (
    <li className={`todo-item ${todo.status === "concluido" ? "done" : ""}`}>
      <span className="todo-text">{todo.texto}</span>
      {todo.tags.length > 0 && (
        <span className="todo-tags">[{todo.tags.join(", ")}]</span>
      )}
      {todo.data_vencimento && (
        <div className="todo-date">
          📅 Vence em: {formataData(todo.data_vencimento)}
        </div>
      )}
      {todo.status === "pendente" && (
        <>
          <button className="todo-start-button" onClick={() => updateTodoStatus(todo.id, "em andamento")}>Iniciar tarefa</button>
          <button className="todo-done-button" onClick={() => updateTodoStatus(todo.id, "concluido")}> ✓</button>
        </>
      )}
      {todo.status === "em andamento" && (
        <button className="todo-done-button" onClick={() => updateTodoStatus(todo.id, "concluido")}>✓</button>
      )}
    </li>
  );
};

export function TodoList() {
  const { token } = useAuth();
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [tagsDisponiveis, setTagsDisponiveis] = useState([]);
  const [nome, setNome] = useState("Minha Lista");
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const listId = params.get("listId");

  const filterBy = (t) => {
    if (filter === "done") return t.status === "concluido";
    if (filter === "pending") return t.status === "pendente";
    if (filter === "em andamento") return t.status === "em andamento";
    return true;
  };

  const fetchTodos = async () => {
    if (!token) return;
    let url = "http://localhost:3000/todos";
    if (filter === "tag" && tagFilter) {
      url = `http://localhost:3000/todos/por-tag?tag=${encodeURIComponent(tagFilter)}`;
    }
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTodos(data);
  };

  const updateTodoStatus = async (id, novoStatus) => {
    const res = await fetch(`http://localhost:3000/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: novoStatus }),
    });
    const updated = await res.json();
    setTodos((prev) => prev.map(t => t.id === updated.id ? updated : t));
  };

  useEffect(() => {
    if (!token || !listId) return;
    (async () => {
      const res = await fetch(`http://localhost:3000/listas/${listId}`, { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      });
      if (res.ok) {
        const lista = await res.json();
        setNome(lista.nome);
      } else {
        console.error("Erro ao buscar nome da lista");
      }
    })();
  }, [listId, token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      let url = "http://localhost:3000/todos";
      if (filter === "tag" && tagFilter) {
        url = `http://localhost:3000/todos/por-tag?tag=${encodeURIComponent(tagFilter)}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTodos(data);
    })();
  }, [token, filter, tagFilter]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await fetch("http://localhost:3000/tags", { headers: { Authorization: `Bearer ${token}` } });
      const tags = await res.json();
      setTagsDisponiveis(tags);
    })();
  }, [token]);

  const addTodo = (newTodo) => {
    setTodos((prev) => [...prev, newTodo]);
    if (filter === "done") setFilter("all");
  };

  const markTodoAsDone = async (id) => {
    const res = await fetch(`http://localhost:3000/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "concluido" }),
    });
    const updated = await res.json();
    setTodos((prev) => prev.map(t => t.id === updated.id ? updated : t));
  };

  return (
    <>
      <NavBar />
      <div className="todos-page">
        <div className="todos-card">
          <h1 className="todos-header">{nome}</h1>
          <TodoFilter
            setFilter={setFilter}
            setTagFilter={setTagFilter}
            tagsDisponiveis={tagsDisponiveis}
          />
          <AddTodo 
            addTodo={addTodo} 
            token={token}
            fetchTodos={fetchTodos}
            listId={listId}
          />
          <ul className="todos-list">
            {todos
              .filter(filterBy)
              .filter(t => String(t.id_lista) === String(listId))
              .map((t,i) => (
                <TodoItem 
                  key={i} 
                  todo={t} 
                  markTodoAsDone={markTodoAsDone} 
                  updateTodoStatus={updateTodoStatus} 
                />
              ))}
          </ul>
        </div>
      </div>
    </>
  );
}