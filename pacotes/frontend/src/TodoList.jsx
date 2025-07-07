import { useState, useEffect } from "react";
import NavBar from "./NavBar";
import { useLocation, useNavigate } from "react-router-dom";

const useAuth = () => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = async (email, senha) => {
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });
      if (!response.ok) throw new Error("Login falhou");
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
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (textoTrim && listId) {
      await fetch("http://localhost:3000/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          texto: textoTrim,
          data_criacao: new Date().toISOString(),
          data_vencimento: dataVencimento
            ? new Date(dataVencimento).toISOString()
            : null,
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
        min={new Date().toISOString().split("T")[0]}
        disabled={!listId}
      />
      <button
        className="add-todo-button"
        type="submit"
        disabled={!listId}
      >
        Confirmar
      </button>
    </form>
  );
};

const TodoFilter = ({ setFilter, setTagFilter, tagsDisponiveis, dateFilter, setDateFilter }) => {
  const [tag, setTag] = useState("");
  const navigate = useNavigate();

  const onDeleteList = async () => {
    const listId = new URLSearchParams(window.location.search).get("listId");
    if (!listId) return;

    try {
      const response = await fetch(`http://localhost:3000/listas/${listId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        alert("Lista excluída com sucesso!");
        navigate("/home");
      }
      else {
        const error = await response.json();
        alert(`Erro ao excluir lista: ${error.message}`);
      }
    }
    catch (error) {
      console.error("Erro ao excluir lista:", error);
      alert("Erro ao excluir lista. Tente novamente mais tarde.");
    }
  };

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
      <button id="filter-all" onClick={handleFilterClick}>
        Todos os Itens
      </button>
      <button id="filter-done" onClick={handleFilterClick}>
        Concluídos
      </button>
      <button id="filter-pending" onClick={handleFilterClick}>
        Pendentes
      </button>
      <button id="filter-em andamento" onClick={handleFilterClick}>
        Em andamento
      </button>
      <select
        className="filter-select"
        value={tag}
        onChange={handleTagChange}
      >
        <option value="">Tags ▾</option>
        {tagsDisponiveis.map((t, i) => (
          <option key={i} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        className="filter-select"
        value={dateFilter}
        onChange={(e) => {
          setDateFilter(e.target.value);
          setFilter("");       // limpa filtro de status
          setTagFilter("");    // limpa filtro de tags
        }}
      >
        <option value="">Data ▾</option>
        <option value="today">Vence hoje</option>
        <option value="week">Nesta semana</option>
        <option value="month">Neste mês</option>
      </select>
      <button
        onClick={() => {
          if (
            window.confirm("Tem certeza que deseja excluir esta lista?")
          ) {
            // onDeleteList placeholder
            console.log("Excluir lista");
          }
        }}
        style={{ marginLeft: 8, background: "#e53935", color: "#fff" }}
      >
        Excluir Lista
      </button>
    </div>
  );
};

const TodoItem = ({ todo, updateTodoStatus }) => {
  // formata dd/mm/yyyy
  const formataData = (data) => {
    const [yyyy, mm, dd] = data.split("T")[0].split("-");
    return `${dd}/${mm}/${yyyy}`;
  };

  // calcula diferença em dias entre hoje e data de vencimento
  const calculaDias = (data) => {
    const hoje = new Date();
    const fim = new Date(data);
    hoje.setHours(0, 0, 0, 0);
    fim.setHours(0, 0, 0, 0);
    const diffMs = fim - hoje;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const dias = todo.data_vencimento
    ? calculaDias(todo.data_vencimento)
    : null;

  let statusDataClass = "";
  if (dias !== null) {
    if (dias < 0) statusDataClass = "due-passed";
    else if (dias <= 1) statusDataClass = "due-soon";
  }

  return (
    <li className={`todo-item ${todo.status === "concluido" ? "done" : ""}`}>
      <span className="todo-text">{todo.texto}</span>
      {todo.tags.length > 0 && (
        <span className="todo-tags">[{todo.tags.join(", ")}]</span>
      )}
      {todo.data_vencimento && (
        <div className={`todo-date ${statusDataClass}`}>
          📅 Vence em: {formataData(todo.data_vencimento)}
        </div>
      )}
      {todo.status === "pendente" && (
        <>
          <button
            className="todo-start-button"
            onClick={() => updateTodoStatus(todo.id, "em andamento")}
          >
            Iniciar tarefa
          </button>
          <button
            className="todo-done-button"
            onClick={() => updateTodoStatus(todo.id, "concluido")}
          >
            ✓
          </button>
        </>
      )}
      {todo.status === "em andamento" && (
        <button
          className="todo-done-button"
          onClick={() => updateTodoStatus(todo.id, "concluido")}
        >
          ✓
        </button>
      )}
    </li>
  );
};

const calculaDias = (data) => {
  const hoje = new Date();
  const fim = new Date(data);
  hoje.setHours(0, 0, 0, 0);
  fim.setHours(0, 0, 0, 0);
  const diffMs = fim - hoje;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export function TodoList() {
  const { token } = useAuth();
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
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

const filterByDate = (t) => {
  if (!dateFilter) return true;
  if (!t.data_vencimento) return false;

  const hoje       = new Date();
  const startOfDay = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dueDate    = new Date(t.data_vencimento);

  if (dateFilter === "today") {
    return (
      dueDate.getFullYear() === startOfDay.getFullYear() &&
      dueDate.getMonth()     === startOfDay.getMonth() &&
      dueDate.getDate()      === startOfDay.getDate()
    );
  }

  if (dateFilter === "week") {
    const diaSemana = hoje.getDay();
    const diff = 6 - diaSemana;
    const endOfWeek = new Date(hoje);
    endOfWeek.setDate(hoje.getDate() + diff);
    endOfWeek.setHours(23,59,59,999);
    return dueDate >= startOfDay && dueDate <= endOfWeek;
  }

  if (dateFilter === "month") {
    const endOfMonth = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0);
    endOfMonth.setHours(23,59,59,999);
    return dueDate >= startOfDay && dueDate <= endOfMonth;
  }

  return true;
};


  const fetchTodos = async () => {
    if (!token || !listId) return;
  
    let url = `http://localhost:3000/todos/por-lista/${listId}`;
    if (filter === "tag" && tagFilter) {
      url = `http://localhost:3000/todos/por-tag?tag=${encodeURIComponent(
        tagFilter
      )}`;
    }
    
    try {
      const res = await fetch(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!res.ok) {
        console.error('Erro na resposta:', res.status);
        return;
      }
      
      const data = await res.json();
      const todosArray = Array.isArray(data) ? data : (data.todos || []);
      setTodos(todosArray);
    } catch (error) {
      console.error('Erro ao buscar todos:', error);
    }
  };

  const updateTodoStatus = async (id, novoStatus) => {
    const res = await fetch(`http://localhost:3000/todos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: novoStatus }),
    });
    const updated = await res.json();
    setTodos((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  useEffect(() => {
    if (!token || !listId) return;
    (async () => {
      const res = await fetch(`http://localhost:3000/listas/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const lista = await res.json();
        setNome(lista.nome);
      }
    })();
  }, [listId, token]);

  useEffect(() => {
    fetchTodos();
  }, [token, filter, tagFilter, listId]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await fetch("http://localhost:3000/tags", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tags = await res.json();
      setTagsDisponiveis(tags);
    })();
  }, [token]);

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
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
            />
          <AddTodo
            token={token}
            fetchTodos={fetchTodos}
            listId={listId}
          />
          <ul className="todos-list">
            {todos
              .filter(filterBy)
              .map((t,i) => (
                <TodoItem 
                  key={i} 
                  todo={t} 
                  updateTodoStatus={updateTodoStatus} 
                />
              ))}
          </ul>
        </div>
      </div>
    </>
  );
}