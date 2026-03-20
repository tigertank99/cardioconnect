"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Trash2, Tag } from "lucide-react";

const TAG_COLORS = ["#e74c3c","#2980b9","#f39c12","#8e44ad","#16a085","#d35400","#27ae60","#c0392b","#3498db","#e67e22","#1abc9c","#9b59b6"];

export default function TagsPage() {
  const supabase = createClient();
  const [tags, setTags] = useState([]);
  const [counts, setCounts] = useState({});
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: tagData } = await supabase.from("tags").select("*").order("name");
    const { data: ptData } = await supabase.from("patient_tags").select("tag_id");
    const c = {};
    (ptData || []).forEach((pt) => { c[pt.tag_id] = (c[pt.tag_id] || 0) + 1; });
    setTags(tagData || []);
    setCounts(c);
    setLoading(false);
  };

  const add = async () => {
    if (!newName.trim()) return;
    await supabase.from("tags").insert({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor(TAG_COLORS[(tags.length + 1) % TAG_COLORS.length]);
    load();
  };

  const remove = async (id) => {
    await supabase.from("patient_tags").delete().eq("tag_id", id);
    await supabase.from("tags").delete().eq("id", id);
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
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-800">Tags</h1>
        <p className="text-sm text-gray-500 mt-1">Organize patients with color-coded tags</p>
      </div>

      {/* Add tag */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tag Name</label>
          <input
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Post-PCI, Urgent..."
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Color</label>
          <div className="flex gap-1.5">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-7 h-7 rounded-lg transition ${newColor === c ? "ring-2 ring-offset-1 scale-110" : "opacity-60 hover:opacity-100"}`}
                style={{ background: c, ringColor: c }}
              />
            ))}
          </div>
        </div>
        <button onClick={add} disabled={!newName.trim()} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Tag list */}
      <div className="space-y-2">
        {tags.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-gray-600">No tags yet</p>
            <p className="text-sm mt-1">Create tags to categorize your patients.</p>
          </div>
        ) : (
          tags.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ background: t.color }} />
              <span className="flex-1 text-sm font-medium">{t.name}</span>
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full">{counts[t.id] || 0} patients</span>
              <button onClick={() => remove(t.id)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
