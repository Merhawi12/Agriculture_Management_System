const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function clean(data) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([k]) => k !== 'created_at')
      .map(([k, v]) => [k, v === '' || v === undefined ? null : v])
  );
}

class SupabaseStore {
  async all(table) {
    const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
    if (error) { console.error(`[db] all(${table}):`, error.message); throw error; }
    return data || [];
  }

  async get(table, id) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) { console.error(`[db] get(${table},${id}):`, error.message); return null; }
    return data;
  }

  async filter(table, fn) {
    const rows = await this.all(table);
    return rows.filter(fn);
  }

  async insert(table, data) {
    const payload = clean(data);
    delete payload.id;
    const { data: row, error } = await supabase.from(table).insert(payload).select().single();
    if (error) { console.error(`[db] insert(${table}):`, error.message); throw error; }
    return row;
  }

  async update(table, id, data) {
    const payload = clean(data);
    delete payload.id;
    const { data: row, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
    if (error) { console.error(`[db] update(${table},${id}):`, error.message); return null; }
    return row;
  }

  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { console.error(`[db] delete(${table},${id}):`, error.message); throw error; }
  }
}

module.exports = new SupabaseStore();
