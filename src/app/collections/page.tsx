import { Metadata } from 'next';
import CollectionsClient from './CollectionsClient';

export const metadata: Metadata = {
  title: 'Collections - Exclusive Lex',
  description: 'Browse our exclusive video collections',
};

export default function CollectionsPage() {
  return <CollectionsClient />;
} 