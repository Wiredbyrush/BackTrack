import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Item, Claim } from '../lib/types';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'claims'>('items');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [itemsRes, claimsRes] = await Promise.all([
      supabase.from('items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('claims').select('*, items (id, name, image_url)').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    setMyItems(itemsRes.data || []);
    setMyClaims(claimsRes.data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'found': case 'claimed': return 'var(--color-success)';
      case 'rejected': return 'var(--color-error)';
      default: return 'var(--color-warning)';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: '#fff',
          margin: '0 auto 1rem'
        }}>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          ) : (
            user?.email?.[0].toUpperCase()
          )}
        </div>
        <h2>{user?.user_metadata?.full_name || 'User'}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
        <button onClick={signOut} className="btn btn-ghost" style={{ marginTop: '1rem' }}>
          Sign Out
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'items' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('items')}
        >
          My Items ({myItems.length})
        </button>
        <button
          className={`btn ${activeTab === 'claims' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('claims')}
        >
          My Claims ({myClaims.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div className="spinner" />
        </div>
      ) : activeTab === 'items' ? (
        myItems.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
            You haven't submitted any items yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myItems.map(item => (
              <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h4>{item.name}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.location}</p>
                </div>
                <span style={{ color: getStatusColor(item.status), fontWeight: '600', textTransform: 'capitalize' }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        myClaims.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
            You haven't made any claims yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myClaims.map(claim => (
              <div key={claim.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {claim.items?.image_url && (
                  <img src={claim.items.image_url} alt={claim.items.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h4>{claim.items?.name}</h4>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    {new Date(claim.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span style={{ color: getStatusColor(claim.status), fontWeight: '600', textTransform: 'capitalize' }}>
                  {claim.status}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
