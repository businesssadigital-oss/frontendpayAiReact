import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, LogIn, ArrowRight, Shield } from 'lucide-react';

const CodeAdmin: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [dir, setDir] = useState<string>('components');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const apiFetch = async (input: RequestInfo, init?: RequestInit) => {
    const headers = new Headers(init?.headers || {});
    if (token) headers.set('x-admin-token', token);
    return fetch(input, { ...(init || {}), headers });
  };

  const loadFiles = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch(`/api/admin/files?dir=${encodeURIComponent(dir)}`);
      if (!res.ok) throw new Error(await res.text());
      const list = await res.json();
      setFiles(list || []);
    } catch (err: any) {
      setMessage(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (p: string) => {
    setSelectedFile(p);
    setContent('');
    setMessage(null);
    try {
      const res = await apiFetch(`/api/admin/file?path=${encodeURIComponent(p)}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const data = await res.json();
      setContent(data.content || '');
    } catch (err: any) {
      setMessage(String(err.message || err));
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const data = await res.json();
      setMessage('Saved successfully.');
    } catch (err: any) {
      setMessage(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">محرر الأكواد (تطوير)</h2>

      <div className="flex gap-2 items-center mb-4">
        <label className="text-sm text-gray-600">Admin Token</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="x-admin-token" className="px-3 py-2 border rounded-lg bg-gray-50 flex-1" />
        <select value={dir} onChange={(e) => setDir(e.target.value)} className="px-3 py-2 border rounded-lg bg-gray-50">
          <option value="components">components</option>
          <option value="services">services</option>
        </select>
        <button onClick={loadFiles} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">قائمة الملفات</button>
      </div>

      <div className="flex gap-4">
        <div className="w-64 bg-gray-50 border border-gray-100 rounded-lg p-2 overflow-auto max-h-[60vh]">
          {loading && <div className="text-sm text-gray-500">جارٍ التحميل...</div>}
          {!loading && files.length === 0 && <div className="text-sm text-gray-400">لا توجد ملفات. اضغط "قائمة الملفات".</div>}
          <ul className="text-sm">
            {files.map(f => (
              <li key={f} className={`p-2 rounded-md cursor-pointer hover:bg-indigo-50 ${selectedFile === f ? 'bg-indigo-100 font-semibold' : ''}`} onClick={() => openFile(f)}>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs text-gray-500">محرر الملف:</div>
            <div className="font-mono text-sm text-gray-700">{selectedFile || '---'}</div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={saveFile} disabled={!selectedFile || loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">حفظ</button>
            </div>
          </div>

          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-[60vh] border rounded-lg p-3 font-mono text-sm bg-white" />

          {message && <div className="mt-2 text-sm text-gray-700">{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default CodeAdmin;