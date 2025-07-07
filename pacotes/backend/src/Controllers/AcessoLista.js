import { getUsuarioPorEmail } from './Usuarios.js';
import { db } from '../configDB.js';

export function criarTabelaAcessoLista() {
    db.run(`
        CREATE TABLE IF NOT EXISTS acesso_lista (
            id_lista TEXT NOT NULL,
            id_usuario TEXT NOT NULL,
            podeEditar BOOLEAN NOT NULL DEFAULT 0,
            PRIMARY KEY (id_lista, id_usuario),
            FOREIGN KEY (id_lista) REFERENCES lista_todos(id) ON DELETE CASCADE,
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
        )`
    );
}

export function insertAcessoLista(idLista, idUsuario) {
    db.run(
        'INSERT INTO acesso_lista (id_lista, id_usuario) VALUES (?, ?)', 
        [idLista, idUsuario]
    );
}

function alteraAcessoLista(idLista, idUsuario, podeEditar) {
    db.run(
        'UPDATE acesso_lista SET podeEditar = ? WHERE id_lista = ? AND id_usuario = ?', 
        [podeEditar ? 1 : 0, idLista, idUsuario]
    );
}

export function getListasComAcessoDoUsuario(idUsuario) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT id_lista FROM acesso_lista WHERE id_usuario = ? AND podeEditar = 0`, [idUsuario], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || []);
        });
    });
}

export function getUsuariosComAcessoALista(idLista) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT id_usuario FROM acesso_lista WHERE id_lista = ?`, [idLista], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || []);
        });
    });
}