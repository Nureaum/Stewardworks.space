import { getCategories, getTags } from '@/app/actions/helpdeskActions'
import AskQuestionForm from '@/components/helpdesk/AskQuestionForm'

export const metadata = {
  title: 'Ask a Question - Help Desk'
}

export default async function AskQuestionPage() {
  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags()
  ])

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask a Question</h1>
        <p className="text-gray-600">Get help from staff and instructors. Provide as much detail as possible.</p>
      </div>
      
      <AskQuestionForm categories={categories} tags={tags} />
    </div>
  )
}
