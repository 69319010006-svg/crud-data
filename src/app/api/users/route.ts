import { NextResponse } from 'next/server';
import { query, initDB } from '@/lib/db';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

// GET: ดึงรายการข้อมูลผู้ใช้ทั้งหมด
export async function GET() {
  try {
    await initDB();
    const result = await query<User>(
      'SELECT id, name, email, role, created_at FROM users ORDER BY id DESC'
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching users:', error);
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

// POST: เพิ่มข้อมูลผู้ใช้ใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อและอีเมลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await initDB();
    const result = await query<User>(
      'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
      [name.trim(), email.trim().toLowerCase(), (role || 'User').trim()]
    );

    return NextResponse.json(
      { success: true, data: result.rows[0], message: 'เพิ่มข้อมูลสำเร็จ' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    // รหัส 23505 คือ unique violation ใน PostgreSQL
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' },
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
