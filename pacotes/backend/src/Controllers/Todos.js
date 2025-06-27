import { associarTagsAoTodo, buscarTagsDoTodo } from './Tags.js';
import { db } from '../configDB.js';
import crypto from "crypto";

export function criarTabelaTodos() {
    db.run(`
        CREATE TABLE IF NOT EXISTS todos (
            id TEXT NOT NULL PRIMARY KEY,
            texto TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente'
        )`
    );
}

export async function allTodos(req, res) {
    console.log('Token recebido:', req.user);
    const allTodos = await getAllTodos();
    const todosComTags = await Promise.all(allTodos.map(async (todo) => ({
        id: todo.id,
        texto: todo.texto,
        status: todo.status,
        tags: await buscarTagsDoTodo(todo.id)
    })));
    return res.status(200).json(todosComTags);
}

export async function criaTodo(req, res) {
    const texto = req.body.texto ?? req.body.texto.trim();
    const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    if (!texto || texto.length === 0) {
        return res.status(400).json({ error: "O texto é obrigatório" });
    }

    const idNovo = crypto.randomUUID();
    await new Promise((resolve, reject) => {
        insertTodo(idNovo, texto);
        resolve();
    });
    await associarTagsAoTodo(idNovo, tags);

    const novoTodo = await getTodoPorId(idNovo);
    const tagsDoTodo = await buscarTagsDoTodo(idNovo);

    return res.status(200).json({
        id: novoTodo.id,
        texto: novoTodo.texto,
        status: novoTodo.status,
        tags: tagsDoTodo
    });
}

export async function atualizaTodo(req, res) {
    const id = req.params.id;
    const todo = await getTodoPorId(id);
    if (!todo) {
        return res.status(404).json({ error: "Todo não encontrado" });
    }

    const isTextoAtualizado = req.body.texto !== undefined && req.body.texto !== null;
    const isStatusAtualizado = typeof req.body.status === "string";
    if (!isTextoAtualizado && !isStatusAtualizado && !Array.isArray(req.body.tags)) {
        return res.status(400).json({ error: "Texto, Feito ou Tags são obrigatórios" });
    }

    const textoNovo = isTextoAtualizado ? req.body.texto.trim() : todo.texto;
    const statusNovo = isStatusAtualizado ? req.body.status : todo.status;
    if (isTextoAtualizado && textoNovo.length === 0) {
        return res.status(400).json({ error: "O texto não pode ser vazio" });
    }

    await new Promise((resolve, reject) => {
        updateTodo(id, textoNovo, statusNovo);
        resolve();
    });

    if (Array.isArray(req.body.tags)) {
        await new Promise((resolve, reject) => {
            db.run(`DELETE FROM todo_tags WHERE todo_id = ?`, [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        await associarTagsAoTodo(id, req.body.tags);
    }

    const todoAtualizado = await getTodoPorId(id);
    const tagsDoTodo = await buscarTagsDoTodo(id);

    return res.status(200).json({
        id: todoAtualizado.id,
        texto: todoAtualizado.texto,
        status: todoAtualizado.status,
        tags: tagsDoTodo
    });
}

function getAllTodos() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM todos`, (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || []);
        });
    });
}

function getTodoPorId(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM todos WHERE id = ?`, [id], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row || null);
        });
    });
}

function insertTodo(id, texto) {
  db.run(
    'INSERT INTO todos (id, texto, status) VALUES (?, ?, ?)', 
    [id, texto, 'pendente'] // ✅ adiciona valor para 'status'
  );
}

function updateTodo(id, texto, status) {
    db.run(
        `UPDATE todos SET texto = ?, status = ? WHERE id = ?`, 
        [texto, status, id]
    );
}