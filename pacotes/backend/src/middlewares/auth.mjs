import { JWT_SECRET_KEY } from "../configDB.js";
import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  console.log(req.header("Authorization"));

  //O Token deve vir no formato "Bearer <token>". Por isso, usamos o split(" ")[1] para pegar apenas o token.
  //Ver: https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Guides/Authentication#authentication_schemes
  //Ver: https://jwt.io/introduction
  const authorizationHeader = req.header("Authorization");
  const type = authorizationHeader && authorizationHeader?.split(" ")[0];
  const token = authorizationHeader && authorizationHeader?.split(" ")[1];
  
  if(!type || type !== "Bearer")
    return res.status(401).json({ error: "Access denied. Invalid authorization scheme." });

  if (!token)
    return res.status(401).json({ error: "Acesso negado. Nenhum token foi informado." });
  
  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido" });
    }
    
    req.user = decoded.usuario;
    next();
  });
};
