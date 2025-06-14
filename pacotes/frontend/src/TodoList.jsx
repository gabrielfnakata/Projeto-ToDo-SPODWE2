import { useState, useEffect } from "react";

const useAuth = () => {
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    try {
      console.log('Tentando login com: ', email);
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"

        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Login failed');
  
      const data = await response.json();
      setToken(data.token);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return { token, login };
};

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
      <button type="submit">Login</button>
    </form>
  ); 
};

const AddTodo = ({ addTodo, token }) => {
  const handleKeyPress = async (event) => {
    if (event.key === "Enter") {
      const input = event.target;
      const text = input.value.trim();

      if (text) {
        const newTodo = await fetch("http://localhost:3000/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: text,
            done: false,
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
      {todo.done ? (
        <li style={{ textDecoration: "line-through" }}>{todo.text}</li>
      ) : (
        <li>
          {todo.text}
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

  const filterBy = (todo) => {
    if (filter === "all") return true;
    if (filter === "done") return todo.done;
    if (filter === "pending") return !todo.done;
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
        done: true,
      }),
    }).then((response) => {
      if (!response.ok) throw new Error("Erro ao marcar a tarefa como concluída");
      
      return response.json();
    });

    setTodos((prevTodos) =>
      prevTodos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
    );
  };

  if (!token) return <LoginForm onLogin={login} />;

  return (
    <>
      <h1>Todo List</h1>
      <div className="center-content">
        Versão inicial da aplicação de lista de tarefas para a disciplina
        SPODWE2
      </div>
      <TodoFilter setFilter={applyFilter} />
      <AddTodo addTodo={addTodo} token={token}/>

      {todos ? (
        <ul id="todo-list">
          {todos.filter(filterBy).map((todo, index) => (
            <TodoItem key={index} todo={todo} markTodoAsDone={markTodoAsDone} />
          ))}
        </ul>
      ) : (
        <div className="center-content">Carregando...</div>
      )}
    </>
  );
};

export { TodoList };
