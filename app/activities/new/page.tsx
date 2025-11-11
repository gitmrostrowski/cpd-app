'use client'; import { useState, FormEvent } from 'react';
export default function Page() {
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState<string | null>(null);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg(null);
    const form = e.currentTarget; const fd = new FormData(form);
    const res = await fetch('/api/activities', { method: 'POST', body: fd });
    const j = await res.json(); if (res.ok) setMsg('Zapisano.'); else setMsg(j?.error || 'Błąd');
    setLoading(false); form.reset();
  }
  return (<div><h1 className='text-2xl font-semibold'>Dodaj aktywność</h1>
    <form onSubmit={onSubmit} className='mt-4 space-y-3 max-w-lg'>
      <input name='title' placeholder='Tytuł' required className='w-full border rounded p-2' />
      <input name='organizer' placeholder='Organizator' className='w-full border rounded p-2' />
      <input type='date' name='activityDate' required className='w-full border rounded p-2' />
      <input type='number' step='0.25' name='points' placeholder='Punkty' required className='w-full border rounded p-2' />
      <select name='status' className='w-full border rounded p-2'><option value='confirmed'>Potwierdzona</option><option value='draft'>Robocza</option></select>
      <input type='file' name='file' accept='.pdf,.jpg,.jpeg,.png' className='w-full' />
      <button disabled={loading} className='px-4 py-2 rounded bg-black text-white'>{loading ? 'Zapisywanie...' : 'Zapisz'}</button>
      {msg && <div className='text-sm text-gray-600'>{msg}</div>}
    </form></div>);
}