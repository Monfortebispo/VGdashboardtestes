import { getDatabase } from "@netlify/database";
import { json, verifyAdminRequest } from "./_lib/auth.mjs";

function decodeMeta(value) {
  try {
    return JSON.parse(Buffer.from(value || "", "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  if (!id) return json({ error: "Identificador do semestre em falta." }, 400);
  const db = getDatabase();

  try {
    if (req.method === "GET") {
      const rows = await db.sql`SELECT payload FROM vg_semesters WHERE id = ${id} LIMIT 1`;
      if (!rows.length) return json({ error: "Semestre não encontrado." }, 404);
      const payload = rows[0].payload;
      return new Response(payload, {
        status: 200,
        headers: {
          "content-type": "application/gzip",
          "content-encoding": "identity",
          "cache-control": "no-store",
        },
      });
    }

    if (req.method === "PUT") {
      if (!verifyAdminRequest(req)) return json({ error: "Acesso não autorizado." }, 401);
      const meta = decodeMeta(req.headers.get("x-semester-meta"));
      if (!meta || meta.id !== id || !meta.label) return json({ error: "Metadados do semestre inválidos." }, 400);
      const payload = Buffer.from(await req.arrayBuffer());
      if (!payload.length) return json({ error: "O ficheiro de dados está vazio." }, 400);
      await db.sql`
        INSERT INTO vg_semesters (id, label, start_date, end_date, range_text, payload, updated_at)
        VALUES (${id}, ${meta.label}, ${meta.start || null}, ${meta.end || null}, ${meta.range || ""}, ${payload}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          label = EXCLUDED.label,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          range_text = EXCLUDED.range_text,
          payload = EXCLUDED.payload,
          updated_at = NOW()
      `;
      return json({ ok: true, id });
    }

    if (req.method === "DELETE") {
      if (!verifyAdminRequest(req)) return json({ error: "Acesso não autorizado." }, 401);
      await db.sql`DELETE FROM vg_semesters WHERE id = ${id}`;
      return json({ ok: true, id });
    }

    return json({ error: "Método não permitido." }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível aceder aos dados do semestre." }, 500);
  }
}
