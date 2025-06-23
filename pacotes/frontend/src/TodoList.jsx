import { useState, useEffect } from "react";

const useAuth = () => {
  const [token, setToken] = useState(null);

  const login = async (email, senha) => {
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, senha: senha }),
      });
      if (!response.ok) throw new Error('Login falhou');
  
      const data = await response.json();
      setToken(data.token);
    } catch (error) {
      console.error("Login error:", error);
    throw error;
    }
  };

  return { token, login };
};

const LoginForm = ({ onLogin , onRegistrar}) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onLogin(email, senha);
    } catch (error) {
      setError("Email ou senha inválidos. Por favor, tente novamente.");
    }
  };

  return (
    <div className="containers">
      <div className="heading">Entrar</div>
      {error && <div className="error-message">{error}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <input
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="input"
          required
        />
        <input
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          className="input"
          required
        />
         <span className="forgot-password">
  <a href="#" onClick={(e) => { e.preventDefault(); onRegistrar(); }}>
    Registre-se
  </a>
</span>
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

const RegisterForm = ({ onVoltarLogin }) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await fetch("http://localhost:3000/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ nome, email, senha }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "E-mail já registrado!");
      }

      setSuccess("Registro concluído!");
      setNome("");
      setEmail("");
      setSenha("");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="containers">
      <div className="heading">Registre-se</div>
      {error && <div className="error-message">{error}</div>}
      {success && <div style={{ color: "green", textAlign: "center" }}>{success}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          type="text"
          className="input"
          required
        />
        <input
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="input"
          required
        />
        <input
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          className="input"
          required
        />
        <span className="forgot-password">
          <a href="#" onClick={(e) => { e.preventDefault(); onVoltarLogin(); }}>
            Voltar para login
          </a>
        </span>
        <button type="submit" className="login-button">Criar conta</button>
      </form>
    </div>
  );
};

const AddTodo = ({ addTodo, token }) => {
  const handleKeyPress = async (event) => {
    if (event.key === "Enter") {
      const input = event.target;
      const texto = input.value.trim();

      if (texto) {
        const newTodo = await fetch("http://localhost:3000/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            texto: texto,
            feito: false,
          }),
        }).then((response) => {
          if (!response.ok) {
            throw new Error("Erro ao adicionar a tarefa");
          }
          return response.json();
        });

        addTodo(newTodo);
        input.value = "";
      }
    }
  };

  return (
    <input
      type="text"
      placeholder="Adicione aqui sua nova tarefa"
      onKeyDown={handleKeyPress}
    />
  );
};

const TodoFilter = ({ setFilter }) => {
  const handleFilterClick = (event) => {
    event.preventDefault();
    const filter = event.target.id.replace("filter-", "");
    setFilter(filter);
  };

  return (
    <div className="center-content">
      <a href="#" id="filter-all" onClick={handleFilterClick}>
        Todos os itens
      </a>
      <a href="#" id="filter-done" onClick={handleFilterClick}>
        Concluídos
      </a>
      <a href="#" id="filter-pending" onClick={handleFilterClick}>
        Pendentes
      </a>
    </div>
  );
};

const TodoItem = ({ todo, markTodoAsDone }) => {
  const handleClick = () => {
    markTodoAsDone(todo.id);
  };

  return (
    <>
      {todo.feito ? (
        <li style={{ textDecoration: "line-through" }}>{todo.texto}</li>
      ) : (
        <li>
          {todo.texto}
          <button onClick={handleClick}>Concluir</button>
        </li>
      )}
    </>
  );
};

const TodoList = () => {
  const { token, login } = useAuth();
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const filterBy = (todo) => {
    if (filter === "all") return true;
    if (filter === "done") return todo.feito;
    if (filter === "pending") return !todo.feito;
  };

  const applyFilter = (newFilter) => {
    setFilter(newFilter);
  };

  useEffect(() => {
    const fetchTodos = async () => {
      if (!token) return;

      try {
        const response = await fetch("http://localhost:3000/todos", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error("Erro ao buscar os dados");
        
        const data = await response.json();
        setTodos(data);
      } catch (error) {
        console.error("Erro ao buscar os dados:", error);
      }
    };

    fetchTodos();
  }, [token]);

  const addTodo = (newTodo) => {
    setTodos((prevTodos) => [...prevTodos, newTodo]);
    if (filter === "done") applyFilter("all");
  };

  const markTodoAsDone = async (id) => {
    const updatedTodo = await fetch(`http://localhost:3000/todos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        feito: true,
      }),
    }).then((response) => {
      if (!response.ok) 
        throw new Error("Erro ao marcar a tarefa como concluída");

      return response.json();
    });

    setTodos((prevTodos) =>
      prevTodos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
    );
  };
  if (!token) {
    return mostrarRegistro
      ? <RegisterForm onVoltarLogin={() => setMostrarRegistro(false)} />
      : <LoginForm onLogin={login} onRegistrar={() => setMostrarRegistro(true)} />;
  }
  return (
    <>
      <h1>Todo List</h1>
      <div className="center-content">
        Versão Final da aplicação de lista de tarefas para a disciplina
        SPODWE2
      </div>
      <TodoFilter setFilter={applyFilter} />
      <AddTodo addTodo={addTodo} token={token}/>

      {todos ? 
        (<ul id="todo-list">
          {todos.filter(filterBy).map((todo, index) => (
            <TodoItem key={index} todo={todo} markTodoAsDone={markTodoAsDone} />
          ))}
        </ul>
        ) :
        (<div className="center-content">Carregando...</div>)
      }
    </>
  );
};

export { TodoList };