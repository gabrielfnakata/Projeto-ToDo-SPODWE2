import * as db  from "./db.mjs";

export const allTodos = (_req, res) => {
  const allTodos = db.getAllTodos.all();

  return res.status(200).json(
    allTodos.map((todo) => ({
      id: todo.id,
      text: todo.text,
      done: Boolean(todo.done),
    }))
  );
}

export const createTodo = (req, res) => {
  const text = req.body.text ?? req.body.text.trim();

  if (!text || text.length === 0) {
    return res.status(400).json({ error: "Text is required" });
  }

  const newId = crypto.randomUUID();

  const newTodo = db.insertTodo.get({ $id: newId, $text: text });

  return res.status(200).json({
    id: newTodo.id,
    text: newTodo.text,
    done: Boolean(newTodo.done),
  });
};

export const updateTodo = (req, res) => {
  const id = req.params.id;

  const todo = db.getTodo.get({ $id: id });

  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }

  const isTextUpdated = req.body.text !== undefined && req.body.text !== null;
  const isDoneUpdated = req.body.done !== undefined && req.body.done !== null;

  if (!isTextUpdated && !isDoneUpdated) {
    return res.status(400).json({ error: "Text or done is required" });
  }

  const newText = isTextUpdated ? req.body.text.trim() : todo.text;
  const newDone = isDoneUpdated ? Number(req.body.done) : todo.done;

  if (isTextUpdated && newText.length === 0) {
    return res.status(400).json({ error: "Text should not be empty" });
  }

  const updatedTodo = db.updateTodo.get({
    $id: id,
    $text: newText,
    $done: newDone,
  });

  return res.status(200).json({
    id: updatedTodo.id,
    text: updatedTodo.text,
    done: Boolean(updatedTodo.done),
  });
}