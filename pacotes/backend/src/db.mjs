import sqlite3 from "sqlite3";

const db = new sqlite3.Database("todo.db", (err) => {
  if (err) {
    console.error("Error opening database " + err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA synchronous = NORMAL");
  db.run("PRAGMA cache_size = 10000");

  db.run(`CREATE TABLE IF NOT EXISTS USERS (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS TODOS (
    id TEXT NOT NULL PRIMARY KEY,
    text TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0,
    id_user TEXT NOT NULL,
    FOREIGN KEY (id_user) REFERENCES USERS(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  )`);

  db.get("SELECT COUNT(*) as count FROM TODOS", (err, row) => {
    if (!err && row.count === 0) {
      db.run(`INSERT INTO USERS (id, name, email, password) 
        VALUES ('1', 'Test User', 'test@example.com', 'password')`);

      db.run(`INSERT INTO TODOS (id, text, done, id_user) VALUES 
        ('b1a8f3e2-7c4a-4f3b-9d6e-8f2d4c9a1b3e', 'Sample Todo 1', 0, '1'),
        ('d4e5c6f7-8a9b-4c2d-9e1f-7b3a6c8d5e4f', 'Sample Todo 2', 0, '1'),
        ('f9e8d7c6-5b4a-3f2e-1d9c-8a7b6e5c4f3d', 'Sample Todo 3', 0, '1')`);
    }
  });
});

const insertUser = db.prepare(
  "INSERT INTO USERS (id, name, email, password) VALUES (?, ?, ?, ?) RETURNING id, name, email"
);

const getUser = db.prepare(
  "SELECT id, name, email, password FROM USERS WHERE email = ?"
);

const insertTodo = db.prepare(
  "INSERT INTO TODOS (id, text, done, id_user) VALUES (?, ?, 0, ?) RETURNING id, text, done"
);

const updateTodo = db.prepare(
  "UPDATE TODOS SET text = ?, done = ? WHERE id = ? RETURNING id, text, done"
);

const getTodo = db.prepare(
  "SELECT id, text, done FROM TODOS WHERE id = ?"
);

const getAllTodos = db.prepare(
  "SELECT id, text, done FROM TODOS WHERE id_user = ?"
);

export { db as database, insertTodo, updateTodo, getTodo, getAllTodos, insertUser, getUser };