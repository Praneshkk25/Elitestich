import { redirect } from 'next/navigation';

export default function Home() {
    // Default to tailor portal
    redirect('/tailor');
}
