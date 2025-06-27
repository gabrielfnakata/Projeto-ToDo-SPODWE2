import { db } from '../configDB.js';

export function criarTabelaTags() {
    db.run(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE
        )`
    );
    db.run(`
        CREATE TABLE IF NOT EXISTS todo_tags (
            todo_id TEXT NOT NULL,
            tag_id INTEGER NOT NULL,
            FOREIGN KEY (todo_id) REFERENCES todos(id),
            FOREIGN KEY (tag_id) REFERENCES tags(id),
            PRIMARY KEY (todo_id, tag_id)
        )`
    );
}

function inserirOuObterTag(nome) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT id FROM tags WHERE nome = ?`, [nome], (err, row) => {
            if (err) return reject(err);
            if (row) return resolve(row.id);
            db.run(`INSERT INTO tags (nome) VALUES (?)`, [nome], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    });
}

export function associarTagsAoTodo(todoId, tags) {
    if (!tags || !Array.isArray(tags)) return Promise.resolve();
    return Promise.all(tags.map(async (tag) => {
        const tagId = await inserirOuObterTag(tag);
        return new Promise((resolve, reject) => {
            db.run(`INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)`, [todoId, tagId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }));
}

export function buscarTagsDoTodo(todoId) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT t.nome FROM tags t
            JOIN todo_tags tt ON t.id = tt.tag_id
            WHERE tt.todo_id = ?
        `, [todoId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.nome));
        });
    });
}

export async function filtrarPorTag(req, res) {
    const tag = req.query.tag;
    if (!tag) return res.status(400).json({ error: "Tag é obrigatória" });

    db.all(`
        SELECT todos.* FROM todos
        JOIN todo_tags ON todos.id = todo_tags.todo_id
        JOIN tags ON tags.id = todo_tags.tag_id
        WHERE tags.nome = ?
    `, [tag], async (err, rows) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar" });
        const todosComTags = await Promise.all((rows || []).map(async (todo) => ({
            id: todo.id,
            texto: todo.texto,
            feito: Boolean(todo.feito),
            tags: await buscarTagsDoTodo(todo.id)
        })));
        return res.status(200).json(todosComTags);
    });
}

export async function listarTags(req, res) {
  db.all(`SELECT DISTINCT nome FROM tags`, (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar tags" });
    res.json(rows.map(row => row.nome));
  });
}