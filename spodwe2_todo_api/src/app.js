import express from "express";
import cors from "cors";

import { PORT  } from "./settings.mjs";

import { auth } from "./middlewares/auth.mjs";

import { registerUser, loginUser } from "./userHandlers.mjs";
import * as todosHandlers from "./todosHandlers.mjs";

const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello, World!");
});

app.post("/users", registerUser);

app.post("/login", loginUser);

app.get("/authtest", auth, (req, res) => {
  res.status(200).json({ message: "ENTERED" });
});

app.get("/todos", auth, todosHandlers.allTodos);
app.post("/todos", auth, todosHandlers.createTodo);
app.put("/todos/:id", auth, todosHandlers.updateTodo);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
