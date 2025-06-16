import { db } from '../configDB.js';

export function criarTabelaTodos() {
    db.run(`
        CREATE TABLE IF NOT EXISTS todos (
            id TEXT NOT NULL PRIMARY KEY,
            texto TEXT NOT NULL,
            feito BOOLEAN NOT NULL DEFAULT 0
        )`
    );
}

export async function allTodos(req, res) {
    console.log('Token recebido:', req.user);
    const allTodos = await getAllTodos();

    return res.status(200).json(
        allTodos.map((todo) => ({
            id: todo.id,
            texto: todo.texto,
            feito: Boolean(todo.feito)
        }))
    );
}

export async function criaTodo(req, res) {
    const texto = req.body.texto ?? req.body.texto.trim();
    if (!texto || texto.length === 0) {
        return res.status(400).json({ error: "O texto é obrigatório" });
    }

    const idNovo = crypto.randomUUID();
    const novoTodo = await new Promise(async (resolve, reject) => {
        insertTodo(idNovo, texto);
        getTodoPorId(idNovo).then(todo => resolve(todo)).catch(err => reject(err));
    });

    return res.status(200).json({
        id: novoTodo.id,
        texto: novoTodo.texto,
        feito: Boolean(novoTodo.feito),
    });
}

export async function atualizaTodo(req, res) {
    const id = req.params.id;
    const todo = await getTodoPorId(id);
    if (!todo) {
        return res.status(404).json({ error: "Todo não encontrado" });
    }

    const isTextoAtualizado = req.body.texto !== undefined && req.body.texto !== null;
    const isFeitoAtualizado = req.body.feito !== undefined && req.body.feito !== null;
    if (!isTextoAtualizado && !isFeitoAtualizado) {
        return res.status(400).json({ error: "Texto e Feito são obrigatórios" });
    }

    const textoNovo = isTextoAtualizado ? req.body.texto.trim() : todo.texto;
    const feitoNovo = isFeitoAtualizado ? Number(req.body.feito) : todo.feito;
    if (isTextoAtualizado && textoNovo.length === 0) {
        return res.status(400).json({ error: "O texto não pode ser vazio" });
    }

    const todoAtualizado = await new Promise((resolve, reject) => {
        updateTodo(id, textoNovo, feitoNovo);
        getTodoPorId(id).then(todo => resolve(todo)).catch(err => reject(err));
    });

    return res.status(200).json({
        id: todoAtualizado.id,
        texto: todoAtualizado.texto,
        feito: Boolean(todoAtualizado.feito),
    });
}

function getAllTodos() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM todos`, (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || null);
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
        'INSERT INTO todos (id, texto, feito) VALUES (?, ?, 0)', 
        [id, texto]
    );
}

function updateTodo(id, texto, feito) {
    db.run(
        `UPDATE todos SET texto = ?, feito = ? WHERE id = ?`, 
        [texto, feito, id]
    );
}