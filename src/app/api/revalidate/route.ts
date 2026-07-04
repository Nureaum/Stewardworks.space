import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  revalidatePath('/hub/library', 'layout');
  revalidatePath('/admin/library', 'layout');
  return NextResponse.json({ revalidated: true });
}
