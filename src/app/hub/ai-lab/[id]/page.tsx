import { getAILab } from '@/app/actions/ai-labs'
import Link from 'next/link'
import { ArrowLeft, Beaker } from 'lucide-react'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'AI Lab',
}

export default async function AILabDetailPage({ params }: { params: { id: string } }) {
  try {
    const lab = await getAILab(params.id)

    if (!lab) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-steward-offwhite p-8 font-exo">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/hub/ai-lab"
            className="inline-flex items-center gap-2 text-steward-dark hover:text-steward-blue transition-colors mb-12"
          >
            <ArrowLeft size={20} />
            <span className="font-bold uppercase tracking-widest text-sm">Back to AI Labs</span>
          </Link>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-2 border-steward-dark/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#FFD700] w-16 h-16 rounded-xl flex items-center justify-center text-steward-dark shadow-md shrink-0">
                <Beaker size={32} />
              </div>
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-steward-blue mb-1">
                  {lab.cohort_name}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-steward-dark">
                  {lab.title}
                </h1>
              </div>
            </div>

            <div className="w-full h-px bg-steward-dark/10 mb-8"></div>

            {/* Content area */}
            <div 
              className="prose prose-lg max-w-none prose-headings:font-black prose-a:text-steward-blue prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: lab.content }}
            />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
