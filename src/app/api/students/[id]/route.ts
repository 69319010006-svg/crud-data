import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Student } from '../route';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: ดึงข้อมูลนักศึกษาตาม sid
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await query<Student>(
      'SELECT sid, sname, phone FROM student WHERE sid = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลนักศึกษาที่ระบุ' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching student by sid:', error);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดึงข้อมูลได้', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: อัปเดตข้อมูลนักศึกษา
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { sname, phone } = body;

    if (!sname) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อนักศึกษา (sname)' },
        { status: 400 }
      );
    }

    const parsedPhone = phone !== undefined && phone !== null && String(phone).trim() !== ''
      ? (!isNaN(Number(phone)) ? Number(phone) : String(phone).trim())
      : null;

    const result = await query<Student>(
      'UPDATE student SET sname = $1, phone = $2 WHERE sid = $3 RETURNING sid, sname, phone',
      [sname.trim(), parsedPhone, id]
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
      message: 'อัปเดตข้อมูลนักศึกษาสำเร็จ',
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
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

// DELETE: ลบข้อมูลนักศึกษา
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await query<Student>(
      'DELETE FROM student WHERE sid = $1 RETURNING sid, sname',
      [id]
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
      message: 'ลบข้อมูลนักศึกษาสำเร็จ',
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
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
