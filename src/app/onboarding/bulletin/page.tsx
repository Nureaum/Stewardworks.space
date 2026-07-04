import React from 'react';
import { getBulletinUpdates, getBulletinEvents } from '@/app/actions/bulletins';
import BulletinUI from './BulletinUI';

export const dynamic = 'force-dynamic';

export default async function BulletinPage() {
  const [updates, events] = await Promise.all([
    getBulletinUpdates(),
    getBulletinEvents()
  ]);

  return <BulletinUI updates={updates} events={events} />;
}
