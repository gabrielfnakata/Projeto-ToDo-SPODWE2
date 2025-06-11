# TODO API


API para ser consumida pela aplicação de exemplo [TODO APP](https://github.com/damorais/spodwe2_todo_app_inicial) da disciplina SPODWE2.



Instruções:

1. Ir até a pasta raíz do projeto

2. Executar o comando para a instalação das dependências: 
```bash
npm install
```

3. Iniciar o servidor da aplicação:

```bash
node src/app.js
```

Caso seja a intenção executar a aplicação com *hot reload* habilitado (útil durante o desenvolvimento):

```bash
npm run dev
```

Desta forma, qualquer alteração de arquivo resultará na reinicialização da aplicação.

Para ambas as formas de execução da aplicação, basta usar *crtl+c* no terminal em questão para que a aplicação seja interrompida.


## Comandos úteis (sempre a partir da raíz do projeto)

Para realizar a criação de um novo usuário.

### Autenticação

- POST  (Criação de um novo usuário):

```bash
curl -i -H "Content-Type: application/json" -X POST -d @samples/users/post/new-user.json  http://localhost:3000/users
```

### Criação de tarefas

Para testar a API:

- GET:

```bash
curl -i http://localhost:3000/todos
```

- POST: 

```bash
curl -i -H "Content-Type: application/json" -X POST -d @samples/todos/post/new-todo.json  http://localhost:3000/todos

curl -i -H "Content-Type: application/json" -X POST -d @samples/todos/post/new-todo-invalid.json  http://localhost:3000/todos
```

- PUT:

```bash
curl -i -H "Content-Type: application/json" -X PUT -d @samples/todos/put/update-todo.json  http://localhost:3000/todos/{ID_DO_TODO}

curl -i -H "Content-Type: application/json" -X PUT -d @samples/todos/put/update-todo-text.json  http://localhost:3000/todos/{ID_DO_TODO}

curl -i -H "Content-Type: application/json" -X PUT -d @samples/todos/put/update-todo-done.json  http://localhost:3000/todos/{ID_DO_TODO}

curl -i -H "Content-Type: application/json" -X PUT -d @samples/todos/put/update-todo-invalid.json  http://localhost:3000/todos/{ID_DO_TODO}
```




## Changelog

### Versão 2025.3.31

- Código foi movido para uma pasta "src": Isto foi feito para separar o código da aplicação dos arquivos de configuração
- Foram adicionadas validações que não estavam sendo feitas
- Identificada a razão do problema com a execução do código SQL
- Criada pasta com dados de exemplo de requisições POST e PUT
- Foi adicionada função para apontar erros na criação do banco de dados
- Removida a dependência do pacote "uuid" - dependência externa, passando a usar o "crypto.randomUUID()", nativo do NodeJs - OBS: A utilização do pacote "uuid" pode ser necessária quando se trata do desenvolvimento de aplicações no navegador, caso seja necessária a geração de um uuid
- Inclusão do nodemon, para hot reload da aplicação, quando em desenvolvimento

### Versão 2025.3.30

- Implementação inicial: Métodos GET, POST e PUT para a manipulação de TODOS, com persistência em banco de dados. Implementação inicial, exibida em sala de aula