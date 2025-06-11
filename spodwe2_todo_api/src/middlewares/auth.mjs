import jwt from "jsonwebtoken";

import { JWT_SECRET_KEY } from "../settings.mjs";

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
    return res.status(401).json({ error: "Access denied. No token provided." });
  
  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};
