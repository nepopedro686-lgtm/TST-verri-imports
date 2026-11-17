import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid media id' }, { status: 400 });
  }

  try {
    const snap = await getDoc(doc(db, 'media', id));
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const data = snap.data() as { mimeType?: string; dataBase64?: string };
    if (!data.dataBase64 || !data.mimeType) {
      return NextResponse.json({ error: 'Corrupted media' }, { status: 500 });
    }

    const buffer = Buffer.from(data.dataBase64, 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': data.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load media' }, { status: 500 });
  }
}
