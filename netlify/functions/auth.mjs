import { createAdminToken, json, passwordMatches } from "./_lib/auth.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    const { password } = await req.json();
    if (!passwordMatches(password)) return json({ error: "Senha incorreta." }, 401);
    return json({ token: createAdminToken(), expiresIn: 28800 });
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível validar o acesso. Verifique as variáveis do Netlify." }, 500);
  }
}

export const config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 5,
  },
};
