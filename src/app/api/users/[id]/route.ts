import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { User } from '../route';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: ดึงข้อมูลผู้ใช้ตาม ID
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'ID ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const result = await query<User>(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลผู้ใช้ที่ระบุ' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching user by id:', error);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดึงข้อมูลได้', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: อัปเดตข้อมูลผู้ใช้
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'ID ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อและอีเมลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const result = await query<User>(
      'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role, created_at',
      [name.trim(), email.trim().toLowerCase(), (role || 'User').trim(), userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลที่ต้องการอัปเดต' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'อัปเดตข้อมูลสำเร็จ',
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE: ลบข้อมูลผู้ใช้
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'ID ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const result = await query<User>(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลที่ต้องการลบ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'ลบข้อมูลสำเร็จ',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการลบข้อมูล',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
