import { criarTabelaAcessoLista } from "./Controllers/AcessoLista.js";
import { criarTabelaListaTodos } from "./Controllers/ListaTodos.js";
import { criarTabelaUsuarios } from "./Controllers/Usuarios.js";
import { criarTabelaTodos } from "./Controllers/Todos.js";
import { criarTabelaTags } from "./Controllers/Tags.js";
import { PORT } from "./configDB.js";
import rotas from "./rotas.js";
import express from "express";
import cors from "cors";

const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

// cuidado com a ordem de criação das tabelas
criarTabelaListaTodos();
criarTabelaUsuarios();
criarTabelaAcessoLista();
criarTabelaTodos();
criarTabelaTags();

app.use(rotas);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});