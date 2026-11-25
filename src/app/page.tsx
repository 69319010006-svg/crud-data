'use client';

import { useState, useEffect, useCallback, useId } from 'react';

interface Student {
  sid: string | number;
  sname: string;
  phone: string | number | null;
}

export default function StudentCrudPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ sid: '', sname: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sidInputId = useId();
  const snameInputId = useId();
  const phoneInputId = useId();

  // ดึงข้อมูลนักศึกษาจาก API
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/students');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to fetch students');
      }

      setStudents(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // เปิด Modal เพื่อเพิ่มข้อมูลใหม่
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({ sid: '', sname: '', phone: '' });
    setIsModalOpen(true);
  };

  // เปิด Modal เพื่อแก้ไขข้อมูล
  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      sid: String(student.sid ?? ''),
      sname: student.sname || '',
      phone: student.phone != null ? String(student.phone) : '',
    });
    setIsModalOpen(true);
  };

  // บันทึกข้อมูล (เพิ่ม หรือ แก้ไข)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sid.trim() || !formData.sname.trim()) {
      alert('กรุณากรอกรหัสนักศึกษา (sid) และชื่อ (sname)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const url = editingStudent ? `/api/students/${encodeURIComponent(String(editingStudent.sid))}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || result.details || 'การดำเนินการไม่สำเร็จ');
      }

      setIsModalOpen(false);
      showSuccess(result.message || (editingStudent ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ'));
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ลบข้อมูล
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/students/${encodeURIComponent(String(deletingStudent.sid))}`, {
        method: 'DELETE',
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || result.details || 'ไม่สามารถลบข้อมูลได้');
      }

      setDeletingStudent(null);
      showSuccess('ลบข้อมูลสำเร็จ');
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setIsDeleting(false);
    }
  };

  // กรองค้นหาข้อมูล
  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    const sidStr = String(s.sid ?? '').toLowerCase();
    const snameStr = String(s.sname ?? '').toLowerCase();
    const phoneStr = String(s.phone ?? '').toLowerCase();
    return (
      sidStr.includes(q) ||
      snameStr.includes(q) ||
      phoneStr.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Student CRUD Dashboard</h1>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-mono">
                  PostgreSQL: rytc.student
                </span>
              </div>
              <p className="text-xs text-slate-500">จัดการข้อมูลนักศึกษา (sid, sname, phone) เชื่อมต่อตรงสู่ฐานข้อมูล</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มนักศึกษาใหม่
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-sm">✕</button>
          </div>
        )}

        {/* Database Error Alert */}
        {error && (
          <div className="mb-6 p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 text-base">การเชื่อมต่อ PostgreSQL ขัดข้อง</h3>
                <p className="text-sm text-amber-800 mt-1 font-mono">{error}</p>

                <div className="mt-3 p-3.5 bg-white/80 border border-amber-200 rounded-lg text-xs text-slate-700 space-y-2">
                  <p className="font-bold text-slate-900">📌 วิธีเชื่อมต่อกับ PostgreSQL ที่รันใน phpPgAdmin (172.24.170.22):</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>เปิดไฟล์ <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-slate-900">.env.local</code> แล้วใส่รหัสผ่านจริงของ user <code className="font-mono text-blue-600">rytc</code></li>
                    <li>
                      หากขึ้น <code>ECONNREFUSED</code> ให้เปิดให้ PostgreSQL ใน Ubuntu รับการเชื่อมต่อจากภายนอก:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-slate-500">
                        <li>ในไฟล์ <code>/etc/postgresql/*/main/postgresql.conf</code> ตั้ง <code>listen_addresses = &apos;*&apos;</code></li>
                        <li>ในไฟล์ <code>/etc/postgresql/*/main/pg_hba.conf</code> เพิ่ม <code>host all all 0.0.0.0/0 md5</code></li>
                        <li>รันคำสั่ง <code>sudo systemctl restart postgresql</code> ใน Ubuntu</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <button
                  onClick={fetchStudents}
                  className="mt-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium transition-colors"
                >
                  ลองเชื่อมต่อใหม่อีกครั้ง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Control Bar & Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหารหัสนักศึกษา, ชื่อ หรือเบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>จำนวนนักศึกษา: <strong className="text-slate-900">{students.length}</strong> คน</span>
            <span className="text-slate-300">|</span>
            <button
              onClick={fetchStudents}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">รหัสนักศึกษา (sid)</th>
                  <th className="px-6 py-3.5">ชื่อ-นามสกุล (sname)</th>
                  <th className="px-6 py-3.5">เบอร์โทรศัพท์ (phone)</th>
                  <th className="px-6 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      <div className="inline-flex flex-col items-center gap-2">
                        <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>กำลังโหลดข้อมูลจาก PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        <p className="text-sm font-medium text-slate-600">ไม่พบข้อมูลนักศึกษาในตาราง student</p>
                        <p className="text-xs text-slate-400">คลิกที่ปุ่ม &quot;เพิ่มนักศึกษาใหม่&quot; เพื่อบันทึกข้อมูล</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.sid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-blue-600">{student.sid}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{student.sname}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{student.phone || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="ลบข้อมูล"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษาใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor={sidInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสนักศึกษา (sid) <span className="text-red-500">*</span>
                </label>
                <input
                  id={sidInputId}
                  type="text"
                  required
                  disabled={!!editingStudent}
                  placeholder="เช่น 00031"
                  value={formData.sid}
                  onChange={(e) => setFormData({ ...formData, sid: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label htmlFor={snameInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล (sname) <span className="text-red-500">*</span>
                </label>
                <input
                  id={snameInputId}
                  type="text"
                  required
                  placeholder="เช่น วาสนา"
                  value={formData.sname}
                  onChange={(e) => setFormData({ ...formData, sname: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor={phoneInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ (phone)
                </label>
                <input
                  id={phoneInputId}
                  type="text"
                  placeholder="เช่น 0812345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSubmitting && (
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                  )}
                  {editingStudent ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบข้อมูล</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              ต้องการลบข้อมูลนักศึกษา <strong className="text-slate-900">{deletingStudent.sname}</strong> (รหัส {deletingStudent.sid}) หรือไม่?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {isDeleting && (
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                )}
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
