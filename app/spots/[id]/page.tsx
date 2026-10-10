import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidDate } from '@/lib/date';
import { findSpot } from '@/lib/spots';
import SpotDetail from './SpotDetail';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: findSpot(id)?.name ?? 'Spot not found' };
}

// Runs on the server so an unknown id gets a real 404, and the header renders from
// spots.json even if the ratings API fails. SpotDetail fetches the rating in the browser.
export default async function SpotPage({ params, searchParams }: Props) {
  const { id } = await params;
  const spot = findSpot(id);
  if (!spot) notFound();

  const query = await searchParams;
  const date = typeof query.date === 'string' && isValidDate(query.date) ? query.date : undefined;
  // ?mock= is a development aid for checking page states; production always uses live data.
  const mock = process.env.NODE_ENV === 'development' && typeof query.mock === 'string' ? query.mock : undefined;

  return <SpotDetail spot={spot} date={date} mock={mock} />;
}
