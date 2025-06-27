import { db } from '../configDB.js';

export function criarTabelaListaTodos() {
    db.run(`
        CREATE TABLE IF NOT EXISTS lista_todos (
            id TEXT NOT NULL PRIMARY KEY,
            nome TEXT NOT NULL,
            criador TEXT NOT NULL,
            FOREIGN KEY (criador) REFERENCES usuarios(id)
        )`
    );
}

export function getListasPorUsuario(userId) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM lista_todos WHERE criador = ?`, [userId], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || []);
        });
    });
}

export function getListaTodosPorId(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM lista_todos WHERE id = ?`, [id], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row || null);
        });
    });
}

export function insertListaTodos(id, nome, criador) {
    db.run(
        `INSERT INTO lista_todos (id, nome, criador) VALUES (?, ?, ?)`, 
        [id, nome, criador]
    );
}

function getAllListaTodos() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM lista_todos`, (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || null);
        });
    });
}