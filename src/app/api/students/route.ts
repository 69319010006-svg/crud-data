import { NextResponse } from 'next/server';
import { query, initDB } from '@/lib/db';

export interface Student {
  sid: string | number;
  sname: string;
  phone: string | number | null;
}

// GET: ดึงรายการข้อมูลนักศึกษาทั้งหมด
export async function GET() {
  try {
    await initDB();
    const result = await query<Student>(
      'SELECT sid, sname, phone FROM student ORDER BY sid ASC'
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST: เพิ่มข้อมูลนักศึกษาใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sid, sname, phone } = body;

    if (!sid || !sname) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสนักศึกษา (sid) และชื่อ (sname)' },
        { status: 400 }
      );
    }

    await initDB();
    const parsedSid = !isNaN(Number(sid)) ? Number(sid) : String(sid).trim();
    const parsedPhone = phone !== undefined && phone !== null && String(phone).trim() !== ''
      ? (!isNaN(Number(phone)) ? Number(phone) : String(phone).trim())
      : null;

    const result = await query<Student>(
      'INSERT INTO student (sid, sname, phone) VALUES ($1, $2, $3) RETURNING sid, sname, phone',
      [parsedSid, sname.trim(), parsedPhone]
    );

    return NextResponse.json(
      { success: true, data: result.rows[0], message: 'เพิ่มข้อมูลนักศึกษาสำเร็จ' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating student:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'รหัสนักศึกษานี้ (sid) มีอยู่ในระบบแล้ว' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
