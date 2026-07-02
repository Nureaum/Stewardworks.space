import Link from 'next/link'
import { HelpdeskQuestion } from '@/types/helpdesk'
import { MessageCircle, Eye, Clock } from 'lucide-react'

interface Props {
  question: HelpdeskQuestion
}

export default function QuestionCard({ question }: Props) {
  const isAnswered = question.status === 'answered'
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
        <Link href={`/hub/helpdesk/${question.id}`} className="block flex-1 group">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-steward-green transition-colors">
            {question.title}
          </h3>
        </Link>
        <div className="flex flex-wrap gap-2">
          {question.category && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
              {question.category.name}
            </span>
          )}
          {question.tags?.map((tag) => (
            <span key={tag.id} className="px-2.5 py-1 bg-steward-green/10 text-steward-green text-xs font-medium rounded-md">
              #{tag.name}
            </span>
          ))}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2 mb-4" dangerouslySetInnerHTML={{ __html: question.description }} />
      
      <div className="flex items-center text-sm text-gray-500 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isAnswered ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="font-medium capitalize">{question.status === 'open' ? 'Pending' : question.status}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{new Date(question.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
