import { criarTabelaUsuarios } from "./Controllers/Usuarios.js";
import { criarTabelaTodos } from "./Controllers/Todos.js";
import { PORT } from "./settings.mjs";
import rotas from "./rotas.js";
import express from "express";
import cors from "cors";

const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

criarTabelaUsuarios();
criarTabelaTodos();
app.use(rotas);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});