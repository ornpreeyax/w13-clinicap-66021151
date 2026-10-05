import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import { getSqlPool } from './db.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 1. เช็คสถานะ API
app.get('/', (_req, res) => res.json({ ok: true, service: 'study-room-api' }));

// 2. ดึงรายการห้องทั้งหมด (แทน /doctors)
app.get('/rooms', async (_req, res, next) => {
  try {
    const pool = await getSqlPool();
    const r = await pool.request()
      .query('SELECT id, name, capacity, building, facilities FROM rooms ORDER BY name');
    res.json(r.recordset);
  } catch (e) { next(e); }
});

// 3. ดึงรายการจองห้องทั้งหมด (แทน /appointments)
app.get('/bookings', async (_req, res, next) => {
  try {
    const pool = await getSqlPool();
    const r = await pool.request().query(`
      SELECT b.id, b.student_name, b.student_id, b.booking_date, b.time_slot,
             r.name AS room_name, r.building
      FROM bookings b 
      JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `);
    res.json(r.recordset);
  } catch (e) { next(e); }
});

// 4. บันทึกการจองห้องใหม่ (พร้อมระบบเช็กจองซ้ำ)
app.post('/bookings', async (req, res, next) => {
  const { room_id, student_name, student_id, booking_date, time_slot } = req.body || {};
  
  if (!room_id || !student_name || !student_id || !booking_date || !time_slot) {
    return res.status(400).json({ error: 'room_id, student_name, student_id, booking_date, time_slot are required' });
  }

  try {
    const pool = await getSqlPool();

    // 1) ตรวจสอบว่าห้องนี้ วันนี้ ช่วงเวลานี้ ถูกจองไปแล้วหรือยัง
    const checkDuplicate = await pool.request()
      .input('room_id', sql.Int, Number(room_id))
      .input('booking_date', sql.Date, new Date(booking_date))
      .input('time_slot', sql.NVarChar(50), String(time_slot))
      .query(`
        SELECT COUNT(*) AS count 
        FROM bookings 
        WHERE room_id = @room_id 
          AND booking_date = @booking_date 
          AND time_slot = @time_slot
      `);

    // 2) ถ้ามีข้อมูลซ้ำ ให้เด้งเตือน error ทันที ไม่บันทึกซ้ำ
    if (checkDuplicate.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'ห้องนี้ถูกจองในวันและช่วงเวลาดังกล่าวไปแล้ว กรุณาเลือกช่วงเวลาหรือห้องอื่น' 
      });
    }

    // 3) ถ้ายังไม่มีคนจอง ทำการลงบันทึกข้อมูลตามปกติ
    const r = await pool.request()
      .input('room_id', sql.Int, Number(room_id))
      .input('student_name', sql.NVarChar(100), String(student_name))
      .input('student_id', sql.NVarChar(20), String(student_id))
      .input('booking_date', sql.Date, new Date(booking_date))
      .input('time_slot', sql.NVarChar(50), String(time_slot))
      .query(`
        INSERT INTO bookings (room_id, student_name, student_id, booking_date, time_slot)
        OUTPUT INSERTED.id, INSERTED.room_id, INSERTED.student_name, INSERTED.student_id, INSERTED.booking_date, INSERTED.time_slot
        VALUES (@room_id, @student_name, @student_id, @booking_date, @time_slot)
      `);

    res.status(201).json(r.recordset[0]);
  } catch (e) { 
    next(e); 
  }
});

// 5. ยกเลิกการจองห้อง
app.delete('/bookings/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid_id' });
  }
  try {
    const pool = await getSqlPool();
    const r = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM bookings WHERE id = @id');
    if (r.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'not_found' });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  if (err.code === 'NO_DB_CONFIG') {
    return res.status(503).json({
      error: 'database_not_configured',
      hint: 'Set AZURE_SQL_CONNECTION_STRING environment variable'
    });
  }
  console.error('unhandled', err);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`study-room-api listening on :${PORT}`);
});