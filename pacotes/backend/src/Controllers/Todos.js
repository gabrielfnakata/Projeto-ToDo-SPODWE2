import { getListaTodosPorId, insertListaTodos, getListasPorUsuario } from './ListaTodos.js';
import { associarTagsAoTodo, buscarTagsDoTodo } from './Tags.js';
import { db } from '../configDB.js';
import crypto from "crypto";

export function criarTabelaTodos() {
    db.run(`
        CREATE TABLE IF NOT EXISTS todos (
            id TEXT NOT NULL PRIMARY KEY,
            texto TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            id_lista TEXT NOT NULL,
            FOREIGN KEY (id_lista) REFERENCES lista_todos(id)
        )`
    );
}

export async function allTodos(req, res) {
    try {
        const userId = req.user.id;
        const allTodos = await getTodosPorUsuario(userId);
        const todosComTags = await Promise.all(allTodos.map(async (todo) => ({
            id: todo.id,
            texto: todo.texto,
            status: todo.status,
            id_lista: todo.id_lista,
            tags: await buscarTagsDoTodo(todo.id)
        })));
        
        return res.status(200).json(todosComTags);
    } 
    catch (err) {
        console.error('Erro ao buscar todos:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

export async function criaTodo(req, res) {
    try {
        const texto = req.body.texto?.trim();
        const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        const userId = req.user.id;
        
        if (!texto || texto.length === 0) {
            return res.status(400).json({ error: "O texto é obrigatório" });
        }

        let listaId = req.body.id_lista;
        if (!listaId) {
            listaId = await getOuCriaListaPadrao(userId);
        } 
        else {
            const lista = await getListaTodosPorId(listaId);
            if (!lista || lista.criador !== userId) {
                return res.status(403).json({ error: "Acesso negado à lista" });
            }
        }

        const idNovo = crypto.randomUUID();
        await new Promise((resolve, reject) => {
            insertTodo(idNovo, texto, listaId);
            resolve();
        });
        await associarTagsAoTodo(idNovo, tags);

        const novoTodo = await getTodoPorId(idNovo);
        const tagsDoTodo = await buscarTagsDoTodo(idNovo);

        return res.status(200).json({
            id: novoTodo.id,
            texto: novoTodo.texto,
            status: novoTodo.status,
            id_lista: novoTodo.id_lista,
            tags: tagsDoTodo
        });
    } 
    catch (err) {
        console.error('Erro ao criar todo:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

export async function atualizaTodo(req, res) {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        
        const todo = await getTodoPorId(id);
        if (!todo) {
            return res.status(404).json({ error: "Todo não encontrado" });
        }

        const lista = await getListaTodosPorId(todo.id_lista);
        if (!lista || lista.criador !== userId) {
            return res.status(403).json({ error: "Acesso negado ao todo" });
        }

        const isTextoAtualizado = req.body.texto !== undefined && req.body.texto !== null;
        const isStatusAtualizado = typeof req.body.status === "string";
        if (!isTextoAtualizado && !isStatusAtualizado && !Array.isArray(req.body.tags)) {
            return res.status(400).json({ error: "Texto, Status ou Tags são obrigatórios" });
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
            id_lista: todoAtualizado.id_lista,
            tags: tagsDoTodo
        });
    } 
    catch (err) {
        console.error('Erro ao atualizar todo:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

async function getOuCriaListaPadrao(userId) {
    const listas = await getListasPorUsuario(userId);
    if (listas.length > 0) {
        return listas[0].id;
    }
    
    const listaId = crypto.randomUUID();
    await new Promise((resolve, reject) => {
        insertListaTodos(listaId, "Minha Lista", userId);
        resolve();
    });

    return listaId;
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

function insertTodo(id, texto, id_lista) {
    db.run(
        'INSERT INTO todos (id, texto, status, id_lista) VALUES (?, ?, ?, ?)', 
        [id, texto, 'pendente', id_lista]
    );
}

function updateTodo(id, texto, status) {
    db.run(
        `UPDATE todos SET texto = ?, status = ? WHERE id = ?`, 
        [texto, status, id]
    );
}

function getTodosPorUsuario(userId) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT t.* FROM todos t 
            INNER JOIN lista_todos l ON t.id_lista = l.id 
            WHERE l.criador = ?
        `, [userId], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || []);
        });
    });
}