'use client'

import { useState } from 'react'

export default function TaxonomyList({ items, type }: { items: any[], type: 'category' | 'tag' }) {
  const [showAll, setShowAll] = useState(false)
  
  const displayItems = showAll ? items : items.slice(0, 8)
  
  return (
    <div className="mt-[16px]">
      <div className="flex flex-wrap gap-[8px]">
        {displayItems.map((item: any) => (
          <span 
            key={item.id}
            className={`text-[12.5px] py-[6px] px-[12px] rounded-[8px] font-[600] ${
              type === 'category' 
                ? 'bg-[#fbf0da] text-[#8a6a2a]' 
                : 'bg-[#eef6ee] text-[#3b6e45]'
            }`}
          >
            {type === 'tag' ? '#' : ''}{item.name}
          </span>
        ))}
      </div>
      {items.length > 8 && (
        <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-block bg-[#fbf5e6] text-[#8a7c66] hover:bg-[#f2ead6] hover:text-[#5c4f3c] px-4 py-2 rounded-lg text-[13px] font-bold transition-colors w-full"
          >
            {showAll ? 'Show Less' : `Show ${items.length - 8} More ${type === 'category' ? 'Categories' : 'Tags'}`}
          </button>
        </div>
      )}
    </div>
  )
}
