"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Search, Plus, Send, Edit3, Trash2, X, Phone, User, ChevronDown } from "lucide-react";

export default function PatientsPage() {
  const supabase = createClient();
  const [patients, setPatients] = useState([]);
  const [tags, setTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [filterTags, setFilterTags] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [msgPatient, setMsgPatient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [{ data: p }, { data: t }, { data: tpl }] = await Promise.all([
      supabase.from("patients").select("*").order("created_at", { ascending: false }),
      supabase.from("tags").select("*").order("name"),
      supabase.from("templates").select("*").order("name"),
    ]);
    setPatients(p || []);
    setTags(t || []);
    setTemplates(tpl || []);
    setLoading(false);
  };

  const savePatient = async (form) => {
    const { patientTags, ...patientData } = form;
    if (editPatient) {
      await supabase.from("patients").update(patientData).eq("id", editPatient.id);
      // Update tags
      await supabase.from("patient_tags").delete().eq("patient_id", editPatient.id);
      if (patientTags?.length) {
        await supabase.from("patient_tags").insert(patientTags.map((tid) => ({ patient_id: editPatient.id, tag_id: tid })));
      }
    } else {
      const { data } = await supabase.from("patients").insert(patientData).select().single();
      if (data && patientTags?.length) {
        await supabase.from("patient_tags").insert(patientTags.map((tid) => ({ patient_id: data.id, tag_id: tid })));
      }
    }
    setShowForm(false);
    setEditPatient(null);
    loadAll();
  };

  const deletePatient = async (id) => {
    await supabase.from("patient_tags").delete().eq("patient_id", id);
    await supabase.from("patients").delete().eq("id", id);
    setDeleteConfirm(null);
    loadAll();
  };

  const toggleFilter = (tagId) => {
    setFilterTags((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
  };

  // Load patient tags for display
  const [patientTagMap, setPatientTagMap] = useState({});
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("patient_tags").select("patient_id, tag_id");
      const map = {};
      (data || []).forEach((pt) => {
        if (!map[pt.patient_id]) map[pt.patient_id] = [];
        map[pt.patient_id].push(pt.tag_id);
      });
      setPatientTagMap(map);
    })();
  }, [patients]);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.phone?.includes(q) || p.diagnosis?.toLowerCase().includes(q);
    const pTags = patientTagMap[p.id] || [];
    const matchTags = filterTags.length === 0 || filterTags.every((tid) => pTags.includes(tid));
    return matchSearch && matchTags;
  });

  const formatPhone = (phone) => {
    if (!phone) return "";
    let cleaned = phone.replace(/[^0-9+]/g, "");
    if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
    return cleaned;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-sm text-gray-500 mt-1">{patients.length} total patients</p>
        </div>
        <button
          onClick={() => { setEditPatient(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-4">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder="Search by name, phone, or diagnosis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tag filters */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">Filter:</span>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleFilter(t.id)}
              className={`shrink-0 px-3 py-1 rounded-md text-xs font-semibold transition ${
                filterTags.includes(t.id)
                  ? "ring-2 ring-offset-1"
                  : "opacity-70 hover:opacity-100"
              }`}
              style={{
                background: t.color + "18",
                color: t.color,
                ...(filterTags.includes(t.id) ? { ringColor: t.color } : {}),
              }}
            >
              {t.name}
            </button>
          ))}
          {filterTags.length > 0 && (
            <button onClick={() => setFilterTags([])} className="text-xs text-gray-400 hover:text-gray-600 ml-1">Clear</button>
          )}
        </div>
      )}

      {filterTags.length > 0 && (
        <p className="text-sm font-semibold text-brand-500 mb-3">
          {filtered.length} patient{filtered.length !== 1 ? "s" : ""} matching {filterTags.length} tag{filterTags.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Patient list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-gray-600">{patients.length === 0 ? "No patients yet" : "No results found"}</p>
            <p className="text-sm mt-1">{patients.length === 0 ? "Add your first patient to get started." : "Try a different search or tag filter."}</p>
          </div>
        ) : (
          filtered.map((p) => {
            const pTags = (patientTagMap[p.id] || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean);
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition animate-slide-up">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {p.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{p.phone}</div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setMsgPatient(p)} className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition" title="Send message">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setEditPatient(p); setShowForm(true); }} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition" title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === p.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deletePatient(p.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded">Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(p.id)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {/* Meta row */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 items-center">
                  {pTags.map((t) => (
                    <span
                      key={t.id}
                      onClick={() => toggleFilter(t.id)}
                      className="cursor-pointer px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: t.color + "18", color: t.color }}
                    >
                      {t.name}
                    </span>
                  ))}
                  {p.diagnosis && <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded text-[10px] font-semibold">{p.diagnosis}</span>}
                  {p.age && <span className="text-[10px] text-gray-400">{p.age} yr</span>}
                  {p.gender && <span className="text-[10px] text-gray-400">{p.gender}</span>}
                  {p.last_visit && <span className="text-[10px] text-gray-400">Visit: {p.last_visit}</span>}
                  {p.notes && <div className="w-full text-[11px] text-gray-400 italic mt-1">{p.notes}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Patient Form Modal */}
      {showForm && (
        <PatientFormModal
          patient={editPatient}
          tags={tags}
          patientTagMap={patientTagMap}
          supabase={supabase}
          onSave={savePatient}
          onClose={() => { setShowForm(false); setEditPatient(null); }}
        />
      )}

      {/* Message Modal */}
      {msgPatient && (
        <MessageModal
          patient={msgPatient}
          templates={templates}
          formatPhone={formatPhone}
          onClose={() => setMsgPatient(null)}
        />
      )}
    </div>
  );
}

// Patient Form Modal
function PatientFormModal({ patient, tags, patientTagMap, supabase, onSave, onClose }) {
  const [form, setForm] = useState({
    name: patient?.name || "",
    phone: patient?.phone || "",
    age: patient?.age || "",
    gender: patient?.gender || "",
    diagnosis: patient?.diagnosis || "",
    notes: patient?.notes || "",
    last_visit: patient?.last_visit || "",
    patientTags: patient ? (patientTagMap[patient.id] || []) : [],
  });
  const [tagInput, setTagInput] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const availableTags = tags.filter((t) => !form.patientTags.includes(t.id) && (!tagInput || t.name.toLowerCase().includes(tagInput.toLowerCase())));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-3">
          <h3 className="font-display text-lg font-bold">{patient ? "Edit Patient" : "Add New Patient"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 px-6">
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Patient full name" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Age</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" type="number" value={form.age} onChange={(e) => update("age", e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Gender</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="">Select</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Last Visit</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" type="date" value={form.last_visit} onChange={(e) => update("last_visit", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Diagnosis</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" value={form.diagnosis} onChange={(e) => update("diagnosis", e.target.value)} placeholder="e.g., ACS NSTEMI, HT Stage II" />
          </div>
          <div className="col-span-2 relative">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.patientTags.map((tid) => {
                const t = tags.find((tg) => tg.id === tid);
                if (!t) return null;
                return (
                  <span key={tid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: t.color + "18", color: t.color }}>
                    {t.name}
                    <button onClick={() => update("patientTags", form.patientTags.filter((id) => id !== tid))} className="hover:opacity-70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                );
              })}
            </div>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
              value={tagInput}
              onChange={(e) => { setTagInput(e.target.value); setShowTagDropdown(true); }}
              onFocus={() => setShowTagDropdown(true)}
              placeholder="Search tags..."
            />
            {showTagDropdown && availableTags.length > 0 && (
              <>
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {availableTags.slice(0, 8).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => { update("patientTags", [...form.patientTags, t.id]); setTagInput(""); setShowTagDropdown(false); }}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                      {t.name}
                    </div>
                  ))}
                </div>
                <div className="fixed inset-0 z-5" onClick={() => setShowTagDropdown(false)} />
              </>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-y min-h-[60px]" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Medications, allergies, notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          <button
            onClick={() => { if (form.name && form.phone) onSave(form); }}
            disabled={!form.name || !form.phone}
            className="px-4 py-2 text-sm text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition disabled:opacity-40 font-semibold"
          >
            {patient ? "Save Changes" : "Add Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Message Modal
function MessageModal({ patient, templates, formatPhone, onClose }) {
  const [selTemplate, setSelTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const apply = (id) => {
    const tpl = templates.find((t) => t.id === id);
    if (tpl) setMessage(tpl.body.replace(/\{name\}/g, patient.name));
    setSelTemplate(id);
  };

  const waLink = `https://wa.me/${formatPhone(patient.phone)}?text=${encodeURIComponent(message)}`;
  const smsLink = `sms:${formatPhone(patient.phone)}?body=${encodeURIComponent(message)}`;
  const copy = () => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-3">
          <h3 className="font-display text-lg font-bold">Message {patient.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pb-2">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-brand-500 px-3 py-1.5 rounded-lg text-xs font-medium">
            <Phone className="w-3 h-3" /> {patient.phone}
          </div>
        </div>
        <div className="px-6 space-y-3 pb-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Template</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" value={selTemplate} onChange={(e) => apply(e.target.value)}>
              <option value="">-- Select template --</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Message</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-y min-h-[100px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type or select a template..." />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["{date}", "{time}", "{medication}"].map((p) => (
              <button key={p} onClick={() => setMessage((m) => m + " " + p)} className="px-2.5 py-1 bg-blue-50 text-brand-500 text-[10px] rounded-md font-medium">{p}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-6 pt-3">
          <button onClick={copy} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">{copied ? "Copied!" : "Copy"}</button>
          <a href={smsLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition inline-flex items-center gap-1.5">SMS</a>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition inline-flex items-center gap-1.5 font-semibold">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
