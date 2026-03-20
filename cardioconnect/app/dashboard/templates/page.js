"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Edit3, Trash2, X, MessageSquare } from "lucide-react";

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", body: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("templates").select("*").order("name");
    setTemplates(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.name || !form.body) return;
    if (editing === "new") {
      await supabase.from("templates").insert(form);
    } else {
      await supabase.from("templates").update(form).eq("id", editing);
    }
    setEditing(null);
    setForm({ name: "", body: "" });
    load();
  };

  const remove = async (id) => {
    await supabase.from("templates").delete().eq("id", id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Message Templates</h1>
          <p className="text-sm text-gray-500 mt-1">{templates.length} templates</p>
        </div>
        <button
          onClick={() => { setEditing("new"); setForm({ name: "", body: "" }); }}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </div>

      {/* Template form */}
      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 animate-slide-up">
          <h3 className="font-semibold text-sm mb-3">{editing === "new" ? "New Template" : "Edit Template"}</h3>
          <input
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none mb-3"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Template name"
          />
          <textarea
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-y min-h-[100px] mb-2"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Message body. Use {name}, {date}, {time}, {medication} as placeholders."
          />
          <div className="flex gap-2 mb-3">
            {["{name}", "{date}", "{time}", "{medication}"].map((p) => (
              <button key={p} onClick={() => setForm((f) => ({ ...f, body: f.body + " " + p }))} className="px-2.5 py-1 bg-blue-50 text-brand-500 text-[10px] rounded-md font-medium">{p}</button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={!form.name || !form.body} className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-semibold disabled:opacity-40">Save</button>
          </div>
        </div>
      )}

      {/* Template list */}
      <div className="space-y-3">
        {templates.length === 0 && !editing ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-gray-600">No templates yet</p>
            <p className="text-sm mt-1">Create message templates for quick messaging.</p>
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">{t.body}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(t.id); setForm({ name: t.name, body: t.body }); }} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(t.id)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
