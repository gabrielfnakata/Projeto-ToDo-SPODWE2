import { registraUsuario, loginUsuario, getAllUsuarios, getUsuarioAtual } from "./Controllers/Usuarios.js";
import { allTodos, criaTodo, atualizaTodo } from "./Controllers/Todos.js";
import { filtrarPorTag, listarTags  } from "./Controllers/Tags.js";
import { auth } from "./middlewares/auth.mjs";
import { Router } from "express";

const rotas = Router();

rotas.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Rotas de Usuários
rotas.post("/usuarios", registraUsuario);
rotas.post("/login", loginUsuario);
rotas.get("/me", auth, getUsuarioAtual);

// Rotas de Todos
rotas.get("/todos", auth, allTodos);
rotas.post("/todos", auth, criaTodo);
rotas.put("/todos/:id", auth, atualizaTodo);

// Rotas de Tags
rotas.get("/todos/por-tag", auth, filtrarPorTag);
rotas.get("/tags", auth, listarTags);

export default rotas;
