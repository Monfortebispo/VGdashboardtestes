import { getDatabase } from "@netlify/database";
import { json, verifyAdminRequest } from "./_lib/auth.mjs";

export default async function handler(req) {
  const db = getDatabase();
  try {
    if (req.method === "GET") {
      const rows = await db.sql`SELECT value FROM vg_settings WHERE id = ${"regions"} LIMIT 1`;
      return json({ regions: rows[0]?.value || {} });
    }
    if (req.method === "PUT") {
      if (!verifyAdminRequest(req)) return json({ error: "Acesso não autorizado." }, 401);
      const body = await req.json();
      if (!body.regions || typeof body.regions !== "object" || Array.isArray(body.regions)) {
        return json({ error: "Configuração de regiões inválida." }, 400);
      }
      const value = JSON.stringify(body.regions);
      await db.sql`
        INSERT INTO vg_settings (id, value, updated_at)
        VALUES (${"regions"}, ${value}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      return json({ ok: true });
    }
    return json({ error: "Método não permitido." }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível gerir a configuração." }, 500);
  }
}
