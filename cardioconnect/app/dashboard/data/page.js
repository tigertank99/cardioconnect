"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Download, Upload, Database, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function DataPage() {
  const supabase = createClient();
  const fileRef = useRef(null);
  const [stats, setStats] = useState({ patients: 0, tags: 0, templates: 0 });
  const [status, setStatus] = useState(null);
  const [confirmImport, setConfirmImport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const [{ count: p }, { count: t }, { count: tpl }] = await Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true }),
      supabase.from("tags").select("*", { count: "exact", head: true }),
      supabase.from("templates").select("*", { count: "exact", head: true }),
    ]);
    setStats({ patients: p || 0, tags: t || 0, templates: tpl || 0 });
    setLoading(false);
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = async () => {
    const { data: patients } = await supabase.from("patients").select("*").order("name");
    const { data: tags } = await supabase.from("tags").select("*");
    const { data: ptags } = await supabase.from("patient_tags").select("*");

    const header = "Name,Phone,Age,Gender,Diagnosis,Tags,Last Visit,Notes";
    const rows = (patients || []).map((p) => {
      const pTagIds = (ptags || []).filter((pt) => pt.patient_id === p.id).map((pt) => pt.tag_id);
      const tagNames = pTagIds.map((tid) => (tags || []).find((t) => t.id === tid)?.name).filter(Boolean).join("; ");
      const esc = (v) => `"${(v || "").toString().replace(/"/g, '""')}"`;
      return [esc(p.name), esc(p.phone), p.age || "", p.gender || "", esc(p.diagnosis), esc(tagNames), p.last_visit || "", esc(p.notes)].join(",");
    });

    downloadFile(header + "\n" + rows.join("\n"), `cardioconnect-patients-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    setStatus({ type: "success", msg: `Exported ${patients.length} patients as CSV.` });
  };

  const exportJSON = async () => {
    const [{ data: patients }, { data: tags }, { data: templates }, { data: ptags }] = await Promise.all([
      supabase.from("patients").select("*"),
      supabase.from("tags").select("*"),
      supabase.from("templates").select("*"),
      supabase.from("patient_tags").select("*"),
    ]);

    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      patients: patients || [],
      tags: tags || [],
      templates: templates || [],
      patient_tags: ptags || [],
    };

    downloadFile(JSON.stringify(backup, null, 2), `cardioconnect-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    setStatus({ type: "success", msg: `Full backup exported (${patients.length} patients, ${tags.length} tags, ${templates.length} templates).` });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.patients || !Array.isArray(data.patients)) {
          setStatus({ type: "error", msg: "Invalid file: missing patients array." });
          return;
        }
        setConfirmImport(data);
        setStatus({ type: "info", msg: `Found ${data.patients.length} patients, ${(data.tags || []).length} tags, ${(data.templates || []).length} templates. Click "Confirm Import" to proceed.` });
      } catch {
        setStatus({ type: "error", msg: "Invalid JSON file." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const doImport = async () => {
    if (!confirmImport) return;
    setStatus({ type: "info", msg: "Importing... please wait." });

    try {
      // Clear existing data
      await supabase.from("patient_tags").delete().neq("patient_id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("patients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert new data
      if (confirmImport.tags?.length) {
        await supabase.from("tags").insert(confirmImport.tags.map(({ id, ...rest }) => rest));
      }
      if (confirmImport.templates?.length) {
        await supabase.from("templates").insert(confirmImport.templates.map(({ id, ...rest }) => rest));
      }
      if (confirmImport.patients?.length) {
        // For v1 imports (from artifact), handle tag arrays
        const patientsClean = confirmImport.patients.map(({ id, tags, patientTags, ...rest }) => rest);
        await supabase.from("patients").insert(patientsClean);
      }

      setConfirmImport(null);
      setStatus({ type: "success", msg: "Data imported successfully! Refresh the page to see updated data." });
      loadStats();
    } catch (err) {
      setStatus({ type: "error", msg: `Import failed: ${err.message}` });
    }
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
        <h1 className="font-display text-2xl font-bold text-gray-800">Data Management</h1>
        <p className="text-sm text-gray-500 mt-1">Export backups and import data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Patients", value: stats.patients, color: "brand" },
          { label: "Tags", value: stats.tags, color: "brand" },
          { label: "Templates", value: stats.templates, color: "brand" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-brand-500">{s.value}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Storage info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-semibold">Supabase Storage</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Free tier: 500 MB database — enough for <strong>100,000+ patients</strong>. No practical limit for a clinic.
        </p>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.max(0.5, (stats.patients / 100000) * 100)}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">{stats.patients} patients</span>
          <span className="text-[10px] text-gray-400">~100,000 capacity</span>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">Export</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-sm border border-brand-500 text-brand-500 rounded-lg hover:bg-brand-50 transition font-medium">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2 text-sm border border-brand-500 text-brand-500 rounded-lg hover:bg-brand-50 transition font-medium">
            <Download className="w-4 h-4" /> Full Backup (JSON)
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">CSV = patient list for Excel. JSON = complete backup including tags & templates.</p>
      </div>

      {/* Import */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">Import</h3>
        <input type="file" accept=".json" ref={fileRef} className="hidden" onChange={handleFile} />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm border border-brand-500 text-brand-500 rounded-lg hover:bg-brand-50 transition font-medium">
            <Upload className="w-4 h-4" /> Load JSON Backup
          </button>
          {confirmImport && (
            <button onClick={doImport} className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition font-semibold">
              Confirm Import
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Import replaces all current data. Export a backup first!</p>
      </div>

      {/* Status */}
      {status && (
        <div className={`rounded-xl p-4 flex items-start gap-3 text-sm ${
          status.type === "error" ? "bg-red-50 text-red-600" :
          status.type === "success" ? "bg-green-50 text-green-600" : "bg-blue-50 text-brand-500"
        }`}>
          {status.type === "error" ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> :
           status.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> :
           <Info className="w-4 h-4 shrink-0 mt-0.5" />}
          {status.msg}
        </div>
      )}
    </div>
  );
}
