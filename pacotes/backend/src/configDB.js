import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('todos.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err.message);
    }
    else {
        db.serialize(() => {
            db.exec(`
                PRAGMA foreign_keys = ON;
                PRAGMA journal_mode = WAL;
                PRAGMA synchronous = NORMAL;
                PRAGMA cache_size = 10000;
            `, (err) => {
                if (err) {
                    console.error('Erro configurando o banco de dados:', err.message);
                    return;
                }
                console.log('Conectado ao banco de dados.');
            });
        });
    }
});


export { db };