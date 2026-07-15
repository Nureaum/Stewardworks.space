'use client'

import { AILabActions } from './AILabActions'

interface AILabCardProps {
  lab: {
    id: string
    title: string
    content: string
    cohort_name: string
    creator?: {
      full_name: string
    }
  }
  userRole: string
}

export default function AILabCard({ lab, userRole }: AILabCardProps) {
  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, rgba(200,150,180,.08), rgba(138,166,196,.05))',
        borderRadius: 12,
        padding: 20,
        border: '2px solid rgba(200,150,180,.2)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = 'rgba(200,150,180,.4)'
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(200,150,180,.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'rgba(200,150,180,.2)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e0ee' }}>{lab.title}</div>
          <div style={{ flexShrink: 0 }}>
            <AILabActions labId={lab.id} />
          </div>
        </div>
        <div style={{ 
          fontSize: 13, 
          color: '#9990ab', 
          marginTop: 8, 
          marginBottom: 14, 
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          <div dangerouslySetInnerHTML={{ __html: lab.content }} className="prose prose-sm max-w-none prose-p:my-0 prose-p:leading-[1.5] text-[#9990ab] [&_p]:text-[#9990ab]" />
        </div>
      </div>
      <div className="font-pixel" style={{ 
        fontSize: 8, 
        color: '#8a7c9d', 
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        gap: 6 
      }}>
        <span>image</span> 
        <span>·</span> 
        <span>{lab.cohort_name}</span>
        {userRole === 'super_admin' && lab.creator && (
          <>
            <span>·</span>
            <span>{lab.creator.full_name}</span>
          </>
        )}
      </div>
    </div>
  )
}
