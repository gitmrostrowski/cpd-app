import Link from 'next/link';
import { createClient } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const supabase = await createClient(); // ⬅️ await!
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <div>Musisz się zalogować.</div>;
  const { data: activities } = await supabase.from('activities').select('id,title,activity_date,points,status').order('activity_date', { ascending: false });
  return (<div><div className='flex items-center justify-between'><h1 className='text-2xl font-semibold'>Aktywności</h1><Link href='/activities/new' className='text-sm underline'>Dodaj</Link></div>
    <div className='mt-4 space-y-2'>{activities?.map(a => (<div key={a.id} className='rounded-md border bg-white p-3 flex items-center justify-between'>
      <div><div className='font-medium'>{a.title}</div><div className='text-xs text-gray-500'>{a.activity_date} • {a.status}</div></div>
      <div className='text-right'><div className='text-lg font-semibold'>{Number(a.points).toFixed(2)}</div><div className='text-xs text-gray-500'>pkt</div></div></div>)) || <div>Brak wpisów.</div>}</div></div>);
}