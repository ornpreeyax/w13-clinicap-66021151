import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null); // State สำหรับเปิด/ปิด ป๊อปอัป

  const [form, setForm] = useState({ 
    room_id: '', 
    student_name: '', 
    student_id: '', 
    booking_date: '', 
    time_slot: '09:00 - 12:00' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  async function load() {
    try {
      setError(null);
      const [r, b] = await Promise.all([
        fetch(`${API_BASE}/rooms`).then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e))),
        fetch(`${API_BASE}/bookings`).then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e))),
      ]);
      setRooms(r);
      setBookings(b);
      if (r.length && !form.room_id) setForm(f => ({ ...f, room_id: r[0].id }));
    } catch (e) {
      setError(e.error || 'failed_to_load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ฟังก์ชันกดเปิดป๊อปอัปรายละเอียดห้อง
  function openRoomModal(room) {
    setSelectedRoom(room);
  }

  // ฟังก์ชันกดจองจากในป๊อปอัป
  function handleBookFromModal(roomId) {
    setForm(f => ({ ...f, room_id: roomId }));
    setSelectedRoom(null); // ปิดป๊อปอัป
    // สโครลลงมาที่ฟอร์มจอง
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'http_error' }));
        throw err;
      }
      setForm({ 
        room_id: rooms[0]?.id || '', 
        student_name: '', 
        student_id: '', 
        booking_date: '', 
        time_slot: '09:00 - 12:00' 
      });
      await load();
    } catch (e) {
      setError(e.error || 'failed_to_book');
    } finally {
      setSubmitting(false);
    }
  }

  async function onCancel(id) {
    if (!confirm('ยืนยันการยกเลิกรายการจองห้องนี้?')) return;
    setCancellingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw await res.json().catch(() => ({ error: 'http_error' }));
      await load();
    } catch (e) {
      setError(e.error || 'failed_to_cancel');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#0f172a',
      paddingBottom: '3rem'
    }}>
      {/* Header Banner */}
      <header style={{ 
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)', 
        color: 'white', 
        padding: '2.5rem 1rem', 
        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              🏛️ Smart Study Room Booking
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
              ระบบจองห้องอ่านหนังสือและพื้นที่การเรียนรู้ หอสมุดกลาง
            </p>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.15)', 
            backdropFilter: 'blur(8px)', 
            padding: '0.5rem 1rem', 
            borderRadius: '9999px', 
            fontSize: '0.85rem', 
            fontWeight: 500 
          }}>
            🟢 Cloud Live Connected
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '2rem auto 0 auto', padding: '0 1rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>
            ⏳ กำลังโหลดข้อมูลระบบ...
          </div>
        )}

        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            borderLeft: '4px solid #ef4444', 
            color: '#b91c1c', 
            padding: '1rem 1.25rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <strong>เกิดข้อผิดพลาด:</strong> {error}
          </div>
        )}

        {!loading && (
          <>
            {/* Section 1: Study Rooms Card Grid (คลิกเพื่อดูป๊อปอัป) */}
            <section style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  📖 รายชื่อห้องอ่านหนังสือที่เปิดให้บริการ
                </h2>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>พร้อมใช้งาน {rooms.length} ห้อง</span>
              </div>

              {rooms.length === 0 ? (
                <p style={{ color: '#64748b' }}>ไม่พบข้อมูลห้องอ่านหนังสือ</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {rooms.map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => openRoomModal(r)}
                      style={{ 
                        backgroundColor: 'white', 
                        borderRadius: '12px', 
                        padding: '1.25rem', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.05)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '1.05rem' }}>
                          {r.name.replace(/\s*\([^)]*\)/g, '')}
                        </span>
                        <span style={{ 
                          backgroundColor: '#eff6ff', 
                          color: '#1d4ed8', 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '6px' 
                        }}>
                          {r.capacity} คน
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>📍 {r.building}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                        📖 {r.facilities || 'สิ่งอำนวยความสะดวกครบครัน'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 2: Form & Current Bookings Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
              
              {/* Form Card */}
              <section style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: '1.75rem', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✍️ จองห้องอ่านหนังสือ
                </h2>

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      เลือกห้อง
                    </label>
                    <select
                      value={form.room_id}
                      onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}
                      style={{ 
                        width: '100%', 
                        padding: '0.65rem 0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1', 
                        fontSize: '0.9rem',
                        backgroundColor: '#fff'
                      }}
                      required
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name.replace(/\s*\([^)]*\)/g, '')} (สูงสุด {r.capacity} คน)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      ชื่อ-นามสกุล ผู้จอง
                    </label>
                    <input
                      type="text"
                      value={form.student_name}
                      onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
                      placeholder="เช่น นายสมชาย ใจดี"
                      style={{ 
                        width: '100%', 
                        padding: '0.65rem 0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1', 
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      รหัสนักศึกษา
                    </label>
                    <input
                      type="text"
                      value={form.student_id}
                      onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                      placeholder="เช่น 6602xxxx"
                      style={{ 
                        width: '100%', 
                        padding: '0.65rem 0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1', 
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      วันที่ต้องการเข้าใช้
                    </label>
                    <input
                      type="date"
                      value={form.booking_date}
                      onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))}
                      style={{ 
                        width: '100%', 
                        padding: '0.65rem 0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1', 
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      ช่วงเวลาใช้งาน
                    </label>
                    <select
                      value={form.time_slot}
                      onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))}
                      style={{ 
                        width: '100%', 
                        padding: '0.65rem 0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1', 
                        fontSize: '0.9rem',
                        backgroundColor: '#fff'
                      }}
                      required
                    >
                      <option value="09:00 - 12:00">09:00 - 12:00 น.</option>
                      <option value="12:00 - 15:00">12:00 - 15:00 น.</option>
                      <option value="15:00 - 18:00">15:00 - 18:00 น.</option>
                      <option value="18:00 - 21:00">18:00 - 21:00 น.</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting || !rooms.length}
                    style={{ 
                      marginTop: '0.5rem',
                      backgroundColor: submitting ? '#94a3b8' : '#2563eb', 
                      color: 'white', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: 'none', 
                      fontWeight: 600, 
                      fontSize: '0.95rem',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    {submitting ? '⏳ กำลังบันทึกการจอง...' : 'ยืนยันการจองห้อง'}
                  </button>
                </form>
              </section>

              {/* Bookings Table Card */}
              <section style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: '1.75rem', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📋 รายการจองล่าสุด ({bookings.length})
                </h2>

                {bookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                    ยังไม่มีการจองในขณะนี้
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {bookings.map(b => (
                      <div key={b.id} style={{ 
                        border: '1px solid #f1f5f9', 
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px', 
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                            {b.room_name}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                            👤 {b.student_name} ({b.student_id})
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                            📅 {new Date(b.booking_date).toLocaleDateString('th-TH')} | ⏰ {b.time_slot}
                          </div>
                        </div>

                        <button 
                          onClick={() => onCancel(b.id)} 
                          disabled={cancellingId === b.id} 
                          style={{ 
                            backgroundColor: '#fee2e2', 
                            color: '#991b1b', 
                            border: 'none', 
                            padding: '0.4rem 0.75rem', 
                            borderRadius: '6px', 
                            fontSize: '0.8rem', 
                            fontWeight: 600,
                            cursor: cancellingId === b.id ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cancellingId === b.id ? 'ยกเลิก...' : 'ยกเลิก'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      {/* 🔴 ส่วนป๊อปอัป (Pop-up Modal) แสดงเมื่อมีการกดเลือกการ์ดห้อง */}
      {selectedRoom && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setSelectedRoom(null)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedRoom(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              ✕
            </button>

            <h2 style={{ margin: '0 0 1rem 0', color: '#2563eb', fontSize: '1.5rem', fontWeight: 800 }}>
              {selectedRoom.name.replace(/\s*\([^)]*\)/g, '')}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <strong>📍 สถานที่:</strong> {selectedRoom.building}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <strong>👥 ความจุรองรับ:</strong> {selectedRoom.capacity} คน
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#334155' }}>
                <strong>🛠️ สิ่งอำนวยความสะดวก:</strong> {selectedRoom.facilities || 'ไม่มีข้อมูล'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleBookFromModal(selectedRoom.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                เลือกห้องนี้เพื่อจอง
              </button>
              <button
                onClick={() => setSelectedRoom(null)}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}