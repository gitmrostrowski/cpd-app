import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const title = String(form.get('title') || '')
    const organizer = String(form.get('organizer') || '')
    const activityDate = String(form.get('activityDate') || '')
    const points = Number(form.get('points') || 0)
    const status = String(form.get('status') || 'confirmed')
    const file = form.get('file') as File | null

    const supabase = await createServerSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: ins, error } = await supabase.from('activities').insert({
      user_id: auth.user.id,
      title,
      organizer,
      activity_date: activityDate,
      points,
      status
    }).select('id').single()

    if (error) throw error
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      const buf = Buffer.from(arrayBuffer)
      const hash = crypto.createHash('sha256').update(buf).digest('hex')
      const path = `certificates/${auth.user.id}/${ins.id}_${file.name}`
      const { error: upErr } = await supabase.storage.from('certificates').upload(path, buf, { contentType: file.type })
      if (upErr) throw upErr
      await supabase.from('attachments').insert({ activity_id: ins.id, file_path: path, file_hash: hash })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 })
  }
}
