import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // -----------------------------------------------------------------------
    // 1. นำ URL ของ n8n Webhook มาใส่ตรงนี้ (แทนที่ข้อความใน "")
    // ตัวอย่าง: "https://primary-production-xxxx.n8n.cloud/webhook/..."
    // -----------------------------------------------------------------------
    const n8nUrl = "https://pannawathwangmontri.app.n8n.cloud/webhook/chat"; 

    const r = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ถ้า n8n ของคุณไม่ได้ตั้งค่า Authentication Header ไว้
        // ให้ลบ หรือ comment บรรทัด "x-api-key" ทิ้งไปเลยครับ (เพื่อป้องกัน Error)
        // "x-api-key": "your-secret-key", 
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
        console.error("n8n Error Status:", r.status);
        return NextResponse.json({ error: "Failed to connect to n8n" }, { status: 500 });
    }

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data);

  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}