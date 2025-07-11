import { insertAcessoLista, getListasComAcessoDoUsuario } from './AcessoLista.js';
import { getUsuarioPorEmail } from './Usuarios.js';
import { getTodosPorLista } from './Todos.js';
import { db } from '../configDB.js';

export function criarTabelaListaTodos() {
    db.run(`
        CREATE TABLE IF NOT EXISTS lista_todos (
            id TEXT NOT NULL PRIMARY KEY,
            nome TEXT NOT NULL,
            criador TEXT NOT NULL,
            FOREIGN KEY (criador) REFERENCES usuarios(id) ON DELETE CASCADE
        )`
    );
}

export async function criaNovaLista(req, res) {
    try {
        const { nome, editores } = req.body;
        const userId = req.body.criador || req.user.id;
        if (!nome || nome.trim().length === 0) {
            return res.status(400).json({ error: "O nome da lista é obrigatório" });
        }
        if (!userId || userId.trim().length === 0) {
            return res.status(400).json({ error: "O id do criador da lista é obrigatório" });
        }

        const id = crypto.randomUUID();
        insertListaTodos(id, nome.trim(), userId);

        if (editores && Array.isArray(editores) && editores.length > 0) {
            for (const email of editores) {
                const usuario = await getUsuarioPorEmail(email.trim());
                if (usuario) {
                    const idUsuario = usuario.id;
                    insertAcessoLista(id, idUsuario);
                }
            }
        }

        return res.status(201).json({ 
            message: "Lista criada com sucesso", 
            id, 
            nome: nome.trim(), 
            criador: userId,
        });
    }
    catch (err) {
        console.error('Erro ao criar nova lista:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

export async function retornaTodasAsListasCompartilhadas(req, res) {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ error: "Usuário não autenticado" });
        }

        const idListas = await getListasComAcessoDoUsuario(userId);
        if (idListas.length === 0) {
            return res.status(404).json({ message: "Nenhuma lista compartilhada encontrada para o usuário" });
        }

        const listas = [];
        for (const id of idListas) {
            const lista = await getListaTodosPorId(id.id_lista);
            if (lista) {
                listas.push(lista);
            }
        }
        if (listas.length === 0) {
            return res.status(404).json({ message: "Nenhuma lista compartilhada encontrada" });
        }

        const listasComPreview = await Promise.all(
        listas.map(async lista => {
            const preview = await getTodosPorLista(lista.id, 7);
            return {
                id: lista.id,
                nome: lista.nome,
                criador: lista.criador,
                todosPreview: preview
            }})
        );

        return res.status(200).json(listasComPreview);
    } 
    catch (err) {
        console.error('Erro ao buscar listas compartilhadas:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

export async function retornaTodasAsListasDoUsuarioAtual(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ error: "Usuário não autenticado" });
    }

    const listas = await getListasPorUsuario(userId);
    if (listas.length === 0) {
      return res.status(404).json({ message: "Nenhuma lista encontrada para o usuário" });
    }

    const listasComPreview = await Promise.all(
      listas.map(async lista => {
        const preview = await getTodosPorLista(lista.id, 7);
        return {
          id: lista.id,
          nome: lista.nome,
          criador: lista.criador,
          todosPreview: preview
        };
      })
    );

    return res.status(200).json(listasComPreview);
  } 
  catch (err) {
    console.error('Erro ao buscar listas do usuário:', err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
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

export async function retornaListaPeloId(req, res) {
    try {
        const idLista = req.params.id;
        if (!idLista) {
            return res.status(400).json({ error: "ID da lista é obrigatório" });
        }
    
        const lista = await getListaTodosPorId(idLista);
        if (!lista) {
            return res.status(404).json({ error: "Lista não encontrada" });
        }

        res.json({
            id: lista.id,
            nome: lista.nome,
            criador: lista.criador
        });
    }
    catch (err) {
        console.error('Erro ao buscar lista pelo ID:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
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

export async function deletarLista(req, res) {
    try {
        const userId = req.user.id;
        const idLista = req.params.id;
        if (!idLista) {
            return res.status(400).json({ error: "ID da lista é obrigatório" });
        }

        const lista = await getListaTodosPorId(idLista);
        if (!lista) {
            return res.status(404).json({ error: "Lista não encontrada" });
        }
        if (lista.criador !== userId) {
            return res.status(403).json({ error: "Você não tem permissão para deletar esta lista" });
        }

        deleteListaTodos(idLista);
        return res.status(200).json({ message: "Lista deletada com sucesso" });
    } 
    catch (err) {
        console.error('Erro ao deletar lista:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

function deleteListaTodos(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM lista_todos WHERE id = ?`, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}