import { getDatabase } from "@netlify/database";
import { json } from "./_lib/auth.mjs";

export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Método não permitido." }, 405);
  try {
    const db = getDatabase();
    const rows = await db.sql`
      SELECT id, label, start_date, end_date, range_text, updated_at
      FROM vg_semesters
      ORDER BY start_date DESC NULLS LAST, updated_at DESC
    `;
    return json({
      semesters: rows.map((row) => ({
        id: row.id,
        label: row.label,
        start: row.start_date ? new Date(row.start_date).toISOString().slice(0, 10) : null,
        end: row.end_date ? new Date(row.end_date).toISOString().slice(0, 10) : null,
        range: row.range_text || "",
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível consultar os semestres." }, 500);
  }
}
