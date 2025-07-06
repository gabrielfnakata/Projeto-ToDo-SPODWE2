import { criaNovaLista, retornaTodasAsListasDoUsuarioAtual, retornaListaPeloId } from "./Controllers/ListaTodos.js";
import { allTodos, criaTodo, atualizaTodo, getTodosVencendo } from "./Controllers/Todos.js";
import { registraUsuario, loginUsuario, getUsuarioAtual } from "./Controllers/Usuarios.js";
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
rotas.get("/todos", auth, allTodos); // Retorna todos os todos do usuário autenticado e todos os atributos dos todos.
rotas.post("/todos", auth, criaTodo); // Cria um novo todo com os atributos: texto, status, data_vencimento, tags.
rotas.put("/todos/:id", auth, atualizaTodo);
rotas.get("/todos/vencendo/:dias", auth, getTodosVencendo); /* Retorna todos os todos que vencem nos próximos X dias, onde X é o parâmetro passado na rota.
pra passar como parâmetro, use no fetch: `.../todos/vencendo/${X}` para ver os todos que tem data de vencimento nos próximos X dias.
*/

// Rotas de Listas
rotas.post("/listas", auth, criaNovaLista); /* Cria uma nova lista de todos. O corpo da requisição deve ser:
{
    "nome": "Nome da Lista",
    "criador": "ID do Usuário Criador"
}
*/
rotas.get("/listas", auth, retornaTodasAsListasDoUsuarioAtual); // Retorna todas as listas do usuario autenticado.
rotas.get("/listas/:id", auth, retornaListaPeloId);

// Rotas de Tags
rotas.get("/todos/por-tag", auth, filtrarPorTag);
rotas.get("/tags", auth, listarTags);


export default rotas;
