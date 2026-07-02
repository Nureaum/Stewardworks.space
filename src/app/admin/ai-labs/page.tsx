import { getAILabs } from '@/app/actions/ai-labs'
import Link from 'next/link'
import { AILabActions } from '@/components/admin/AILabActions'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const metadata = {
  title: 'AI Labs Management - Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminAILabsPage() {
  try {
    const { userId } = await auth()
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('role').eq('clerk_user_id', userId).single()
    const userRole = profile?.role

    const aiLabs = await getAILabs()

    return (
      <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-[16px] mb-[8px] flex-wrap">
          <div className="flex items-center gap-[12px]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c8963e" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M10 3v6l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3"></path></svg>
            <div>
              <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">AI LABS</h1>
              <p className="mt-[6px] mb-0 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">CREATIVE LABS POWERED BY EDEN.ART</p>
            </div>
          </div>
          <Link
            href="/admin/ai-labs/create"
            className="bg-[#241c12] text-[#efd9a8] px-6 py-[11px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
          >
            + Create AI Lab
          </Link>
        </div>

        {/* API Block (Static representation for layout) */}
        <div className="bg-gradient-to-br from-[#2a2118] to-[#1a130c] rounded-[20px] p-[26px] shadow-[0_16px_34px_rgba(0,0,0,0.24)] border border-[#e2b54a]/15 mt-[20px]">
          <div className="flex items-center justify-between flex-wrap gap-[16px]">
            <div className="flex items-center gap-[16px]">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#e2b54a]/15 flex items-center justify-center text-[24px]">🌿</div>
              <div>
                <div className="font-[800] text-[18px] text-white">eden.art API</div>
                <div className="text-[13px] text-[#fff4e1]/60 mt-[3px]">Workspace connected to eden.art</div>
              </div>
            </div>
            <div className="flex items-center gap-[6px] bg-white/5 rounded-full px-[15px] py-[7px]">
              <span className="w-[8px] h-[8px] rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              <span className="font-[800] text-[11px] tracking-[0.14em] uppercase text-green-400">Connected</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] mt-[20px]">
            <div className="bg-white/5 rounded-[12px] p-[14px_16px]">
              <div className="font-mono text-[10px] tracking-[0.12em] text-[#fff4e1]/50">ENDPOINT</div>
              <div className="text-[13px] text-[#efd9a8] mt-[4px] font-mono">/v2/tasks/create</div>
            </div>
            <div className="bg-white/5 rounded-[12px] p-[14px_16px]">
              <div className="font-mono text-[10px] tracking-[0.12em] text-[#fff4e1]/50">MODELS</div>
              <div className="text-[13px] text-[#efd9a8] mt-[4px]">image · video · lora</div>
            </div>
            <div className="bg-white/5 rounded-[12px] p-[14px_16px]">
              <div className="font-mono text-[10px] tracking-[0.12em] text-[#fff4e1]/50">DEFAULT COHORT</div>
              <div className="text-[13px] text-[#efd9a8] mt-[4px]">Pilot Cohort 01</div>
            </div>
          </div>
        </div>

        <div className="font-mono text-[11px] tracking-[0.18em] text-[#9c8d76] mt-[26px] mb-[14px]">LABS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          {aiLabs.length === 0 ? (
            <div className="col-span-1 md:col-span-2 p-[22px] bg-white rounded-[18px] border border-[#785a32]/10 text-center text-[#8a7c66] font-mono text-[11px] tracking-[0.16em] uppercase">
              No AI Labs found. Create one to get started.
            </div>
          ) : (
            aiLabs.map((lab) => (
              <div key={lab.id} className="bg-white rounded-[18px] p-[22px] shadow-[0_10px_26px_rgba(120,90,50,0.1)] border border-[#785a32]/10 flex flex-col justify-between group hover:-translate-y-[2px] hover:shadow-[0_16px_32px_rgba(120,90,50,0.15)] transition-all">
                <div>
                  <div className="flex justify-between items-start gap-[12px]">
                    <div className="font-[800] text-[16px] text-[#241c12]">{lab.title}</div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AILabActions labId={lab.id} />
                    </div>
                  </div>
                  <div className="text-[13px] text-[#8a7c66] mt-[8px] mb-[14px] leading-[1.5] line-clamp-2">
                    <div dangerouslySetInnerHTML={{ __html: lab.content }} className="prose prose-sm max-w-none prose-p:my-0 prose-p:leading-[1.5] text-[#8a7c66] [&_p]:text-[#8a7c66]" />
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[#a89a82] flex flex-wrap items-center gap-[6px]">
                  <span>image</span> 
                  <span>·</span> 
                  <span>{lab.cohort_name}</span>
                  {userRole === 'super_admin' && (
                    <>
                      <span>·</span>
                      <span>{lab.creator?.full_name}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading AI Labs. Please try again.
      </div>
    )
  }
}
