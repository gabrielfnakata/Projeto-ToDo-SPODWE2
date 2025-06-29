import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import HomePage from "./HomePage";
import { TodoList } from "./TodoList";
import CreateListPage from "./CreateListPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/todos" element={<TodoList />} />
       <Route path="/listas/create" element={<CreateListPage />} />git
    </Routes>
  );
}