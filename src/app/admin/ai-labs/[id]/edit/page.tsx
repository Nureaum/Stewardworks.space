import { getAILab } from '@/app/actions/ai-labs'
import { getCohorts } from '@/app/actions/workshops/cohorts'
import EditAILabForm from './EditAILabForm'

export const metadata = {
  title: 'Edit AI Lab - Admin',
}

export default async function EditAILabPage({ params }: { params: { id: string } }) {
  try {
    const lab = await getAILab(params.id)
    const cohorts = await getCohorts()
    
    return <EditAILabForm lab={lab} cohorts={cohorts} />
  } catch (error) {
    return <div className="p-8 text-red-600">AI Lab not found or an error occurred.</div>
  }
}
