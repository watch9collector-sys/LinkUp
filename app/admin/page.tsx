'use client' 
import { GlassCard } from "../components/GlassCard";
import { TextLink } from "../components/TextLink";
import { supabase } from "@/src/lib/supabase";



const testSignup = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@test.com',
    password: 'password123'
  })

  console.log('DATA:', data)
  console.log('ERROR:', error)
}

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TextLink href="/">← Back to app</TextLink>
      </div>
      
      <button
  type="button"
  onClick={testSignup}
  className="rounded-lg bg-emerald-400 px-4 py-2 font-bold text-black"
>
  Test Signup
</button>



      <GlassCard className="py-10 sm:py-12">
        <h1 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
          Admin Dashboard: User Reports
        </h1>
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-emerald-500/25 bg-[#0B0F14]/40 px-6 py-14 text-center">
          <p className="text-4xl opacity-90" aria-hidden>
            📋
          </p>
          <p className="mt-4 text-[15px] font-medium text-white/88">
            No reports found
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            When users submit reports, they will appear in this queue.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
