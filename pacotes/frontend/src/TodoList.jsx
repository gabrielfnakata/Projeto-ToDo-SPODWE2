import { useState, useEffect } from "react";
import NavBar from "./NavBar";

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



const AddTodo = ({ addTodo, token }) => {
  const [texto, setTexto] = useState("");
  const [tags, setTags] = useState("");

  const handleAdd = async (event) => {
  event.preventDefault();
  const textoTrim = texto.trim();
  const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t.length > 0);

  if (textoTrim) {
    const newTodo = await fetch("http://localhost:3000/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        texto: textoTrim,
        feito: false,
        tags: tagsArray,
      }),
    }).then((res) => {
      if (!res.ok) throw new Error("Erro ao adicionar a tarefa");
      return res.json();
    });

    addTodo(newTodo); 
    setTexto("");
    setTags("");
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
      />
      <input
        className="add-todo-input"
        type="text"
        placeholder="Adicione uma tag"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <button className="add-todo-button" type="submit">
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
      <select className="filter-select" value={tag} onChange={handleTagChange}>
        <option value="">Tags ▾</option>
        {tagsDisponiveis.map((t,i) => (
          <option key={i} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
};

const TodoItem = ({ todo, markTodoAsDone }) => {
  return (
    <li className={`todo-item${todo.feito ? " done" : ""}`}>
      <span className="todo-text">{todo.texto}</span>
      {todo.tags.length > 0 && (
        <span className="todo-tags">[{todo.tags.join(", ")}]</span>
      )}
      {!todo.feito && (
        <button className="todo-done-button" onClick={() => markTodoAsDone(todo.id)}>
          ✓
        </button>
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

  const filterBy = (t) => {
    if (filter === "done") return t.feito;
    if (filter === "pending") return !t.feito;
    return true;
  };

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
      body: JSON.stringify({ feito: true }),
    });
    const updated = await res.json();
    setTodos((prev) => prev.map(t => t.id===updated.id ? updated : t));
  };

  return (
    <>
      <NavBar />
      <div className="todos-page">
        <div className="todos-card">
          <h1 className="todos-header">Nome Todo</h1>
          <TodoFilter
            setFilter={setFilter}
            setTagFilter={setTagFilter}
            tagsDisponiveis={tagsDisponiveis}
          />
          <AddTodo addTodo={addTodo} token={token} />
          <ul className="todos-list">
            {todos.filter(filterBy).map((t,i) => (
              <TodoItem key={i} todo={t} markTodoAsDone={markTodoAsDone} />
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
