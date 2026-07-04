import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import SubmitFeedbackClient from './SubmitFeedbackClient';

export default async function SubmitFeedbackPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/login');
  }

  // Pass user details to the client
  const userData = {
    firstName: user.firstName,
    lastName: user.lastName,
    id: user.id
  };

  return <SubmitFeedbackClient user={userData} projectAreas={[]} />;
}
