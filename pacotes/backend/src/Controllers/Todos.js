import { getListaTodosPorId, insertListaTodos, getListasPorUsuario } from './ListaTodos.js';
import { associarTagsAoTodo, buscarTagsDoTodo } from './Tags.js';
import { getUsuariosComAcessoALista } from './AcessoLista.js';
import { db } from '../configDB.js';
import crypto from "crypto";

export function criarTabelaTodos() {
    db.run(`
        CREATE TABLE IF NOT EXISTS todos (
            id TEXT NOT NULL PRIMARY KEY,
            texto TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_vencimento DATETIME NOT NULL,
            id_lista TEXT NOT NULL,
            FOREIGN KEY (id_lista) REFERENCES lista_todos(id) ON DELETE CASCADE
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
            data_criacao: todo.data_criacao,
            data_vencimento: todo.data_vencimento,
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
        const userId = req.user.id;

        const idNovo = crypto.randomUUID();

        const texto = req.body.texto?.trim();
        if (!texto || texto.length === 0) {
            return res.status(400).json({ error: "O texto é obrigatório" });
        }

        const status = req.body.status || 'pendente';
        const dataCriacao = req.body.data_criacao || new Date().toISOString();

        let dataVencimento = req.body.data_vencimento;
        if (!dataVencimento || dataVencimento < dataCriacao) {
            const dataAtual = new Date();
            const vencimento = new Date(dataAtual);
            vencimento.setDate(dataAtual.getDate() + 7);
            dataVencimento = vencimento.toISOString();
        }
        
        let listaId = req.body.id_lista;
        if (!listaId) {
            listaId = await retornaOuCriaListaPadrao(userId);
        } 
        else {
            const lista = await getListaTodosPorId(listaId);
            const usuariosConvidados = await getUsuariosComAcessoALista(listaId);
            if (!lista || (lista.criador !== userId && !usuariosConvidados.map(u => u.id_usuario).includes(userId))) {
                return res.status(403).json({ error: "Acesso negado à lista" });
            }
        }

        await new Promise((resolve, reject) => {
            insertTodo(idNovo, texto, status, dataCriacao, dataVencimento, listaId);
            resolve();
        });

        const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        await associarTagsAoTodo(idNovo, tags);

        const novoTodo = await getTodoPorId(idNovo);
        const tagsDoTodo = await buscarTagsDoTodo(idNovo);

        return res.status(200).json({
            id: novoTodo.id,
            texto: novoTodo.texto,
            status: novoTodo.status,
            data_criacao: novoTodo.data_criacao,
            data_vencimento: novoTodo.data_vencimento,
            id_lista: novoTodo.id_lista,
            tags: tagsDoTodo
        });
    } 
    catch (err) {
        console.error('Erro ao criar todo:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

export async function getTodosVencendo(req, res) {
    try {
        const userId = req.user.id;

        const numeroDias = parseInt(req.params.dias);
        if (isNaN(numeroDias) || numeroDias <= 0) {
            return res.status(400).json({ error: "Número de dias inválido" });
        }

        const todos = await getTodosNaoConcluidosPorUsuario(userId);
        if (todos.length === 0) {
            return res.status(404).json({ error: "Nenhum todo encontrado" });
        }

        return res.status(200).json(
            todos.filter(todo => {
                const dataVencimento = new Date(todo.data_vencimento);
                const dataAtual = new Date();
                const dataLimite = retornaDataComDiasSomados(numeroDias, dataAtual);
                return dataVencimento >= dataAtual && dataVencimento <= dataLimite;
            }).map(todo => ({
                id: todo.id,
                texto: todo.texto,
                status: todo.status,
                data_criacao: todo.data_criacao,
                data_vencimento: todo.data_vencimento,
                id_lista: todo.id_lista,
                tags: buscarTagsDoTodo(todo.id)
            }))
        );
    }
    catch (err) {
        console.error('Erro ao buscar todos vencendo:', err);
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

export async function retornaTodosPorLista(req, res) {
    try {
        const idLista = req.params.id;
        if (!idLista) {
            return res.status(400).json({ error: "ID da lista é obrigatório" });
        }
        const lista = await getListaTodosPorId(idLista);
        if (!lista) {
            return res.status(404).json({ error: "Lista não encontrada" });
        }
        const todos = await getAllTodosByList(idLista);
        const todosComTags = await Promise.all(todos.map(async (todo) => ({
            id: todo.id,
            texto: todo.texto,
            status: todo.status,
            data_criacao: todo.data_criacao,
            data_vencimento: todo.data_vencimento,
            id_lista: todo.id_lista,
            tags: await buscarTagsDoTodo(todo.id)
        })));

        return res.status(200).json(todosComTags);
    }
    catch(err) {
        console.error('Erro ao buscar todos por lista:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

async function retornaOuCriaListaPadrao(userId) {
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

function insertTodo(id, texto, status = 'pendente', data_criacao, data_vencimento, id_lista) {
    db.run(
        'INSERT INTO todos (id, texto, status, data_criacao, data_vencimento, id_lista) VALUES (?, ?, ?, ?, ?, ?)', 
        [id, texto, status, data_criacao, data_vencimento, id_lista]
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

function getTodosNaoConcluidosPorUsuario(userId) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT t.* FROM todos t 
            INNER JOIN lista_todos l ON t.id_lista = l.id 
            WHERE l.criador = ? AND t.status != 'concluido'
        `, [userId], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || []);
        });
    });
}

function retornaDataComDiasSomados(numeroDias, dataInicio = new Date()) {
    const dataSomada = new Date(dataInicio);
    dataSomada.setDate(dataInicio.getDate() + numeroDias);

    return dataSomada;
}

function getAllTodosByList(idLista) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT *
       FROM todos
       WHERE id_lista = ?`,
      [idLista],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

export function getTodosPorLista(idLista, limit = 7) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, texto, status
       FROM todos
       WHERE id_lista = ?
       ORDER BY data_criacao DESC
       LIMIT ?`,
      [idLista, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}