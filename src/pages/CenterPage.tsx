import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Center {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export default function CenterPage() {
  const { centerSlug } = useParams();
  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (centerSlug) fetchCenter();
  }, [centerSlug]);

  async function fetchCenter() {
    setLoading(true);
    const { data, error } = await supabase
      .from('centers')
      .select('*')
      .eq('subdomain', centerSlug)
      .single();

    if (error) {
      console.error('Error fetching center:', error);
    } else {
      setCenter(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-600 animate-pulse">
          Loading center data...
        </p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-red-600">
          Center not found ❌
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-blue-600">{center.name}</h1>
      {center.address && <p className="text-gray-700 mt-2">{center.address}</p>}
      {center.email && <p className="text-gray-500">{center.email}</p>}
      {center.phone && <p className="text-gray-500">{center.phone}</p>}
    </div>
  );
}
