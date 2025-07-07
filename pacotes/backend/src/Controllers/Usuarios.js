import { JWT_EXPIRATION, JWT_SECRET_KEY } from "../configDB.js";
import { db } from '../configDB.js';
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function criarTabelaUsuarios() {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT NOT NULL PRIMARY KEY,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL
        )`
    );
}

export async function retornaTodosOsEmails(req, res) {
    try {
        const idUsuario = req.user.id;
        if (!idUsuario) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const emails = await getAllEmailsExceptUser(idUsuario);
        return res.status(200).json(emails);
    }
    catch (err) {
        console.error('Erro ao retornar todos os emails:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

export async function registraUsuario(req, res) {
    try {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios" });
        }
    
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Formato de email inválido" });
        }
    
        const usuarioExistente = await getUsuarioPorEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ error: "Email já existente" });
        }
    
        const senhaEncriptada = bcrypt.hashSync(senha, 10);
        const idUsuario = crypto.randomUUID();
    
        const novoUsuario = await new Promise((resolve, reject) => {
            insertUsuario(idUsuario, nome, email, senhaEncriptada);
            getUsuarioPorId(idUsuario).then(usuario => resolve(usuario)).catch(err => reject(err));
        });

        return res.status(201).json({
            id: novoUsuario.id, 
            nome: novoUsuario.nome, 
            email: novoUsuario.email 
        });
    } 
    catch (err) {
        console.error('Erro ao registrar usuário:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

export async function loginUsuario(req, res) {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ error: "Email e senha são obrigatórios" });
        }
    
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Formato de email inválido" });
        }
    
        const usuario = await getUsuarioPorEmail(email);
        if (!usuario) {
            return res.status(404).json({ error: "E-mail ou senha inválidos" });
        }
    
        const isSenhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!isSenhaValida) {
            return res.status(401).json({ error: "Email ou senha inválidos" });
        }
    
        const token = jwt.sign(
        { 
            usuario: { 
                id: usuario.id, 
                email: usuario.email 
            }
        }, JWT_SECRET_KEY, { expiresIn: JWT_EXPIRATION });
    
        res.json({
            email: usuario.email,
            nome: usuario.nome, 
            token 
        });
    }
    catch (err) {
        console.error('Erro ao fazer login:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

export async function getUsuarioAtual(req, res) {
    try {
        const idUsuario = req.user.id;
        if (!idUsuario) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const usuario = await getUsuarioPorId(idUsuario);
        if (!usuario) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        res.json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        });
    } catch (err) {
        console.error('Erro ao buscar usuário atual:', err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}

function getUsuarioPorId(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM usuarios WHERE id = ?`, [id], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row || null);
        });
    });
}

export function getUsuarioPorEmail(email) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row || null);
        });
    });
}

function insertUsuario(id, nome, email, senha) {
    db.run(
        `INSERT INTO usuarios (id, nome, email, senha) VALUES (?, ?, ?, ?)`, 
        [id, nome, email, senha]
    );
}

export function getAllUsuarios() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM usuarios`, (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || null);
        });
    });
}

function getAllEmailsExceptUser(idUsuario) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT email FROM usuarios WHERE id != ?`, [idUsuario], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows || null);
        });
    });
}

function updateUsuario(usuario) {
    db.run(
        `UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?`, 
        [usuario.nome, usuario.email, usuario.senha, usuario.id]
    );
}

function deleteUsuario(id) {
    db.run(`DELETE FROM usuarios WHERE id = ?`, [id], (err) => {
        if (err) {
            console.error('Erro ao deletar usuário:', err.message);
        }
        console.log('Usuário deletado com sucesso');
    });
}