import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Item, Claim } from '../lib/types';

export default function AdminPage() {
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'claims'>('items');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [itemsRes, claimsRes] = await Promise.all([
      supabase.from('items').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('claims').select('*, items (id, name, location, category, image_url)').eq('status', 'pending').order('created_at', { ascending: false })
    ]);

    setPendingItems(itemsRes.data || []);
    setPendingClaims(claimsRes.data || []);
    setLoading(false);
  };

  const handleItemAction = async (id: string, status: 'found' | 'rejected') => {
    await supabase.from('items').update({ status }).eq('id', id);
    fetchData();
  };

  const handleClaimAction = async (id: string, itemId: string, status: 'approved' | 'rejected') => {
    await supabase.from('claims').update({ status }).eq('id', id);
    if (status === 'approved') {
      await supabase.from('items').update({ status: 'claimed' }).eq('id', itemId);
    }
    fetchData();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'items' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('items')}
        >
          Pending Items ({pendingItems.length})
        </button>
        <button
          className={`btn ${activeTab === 'claims' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('claims')}
        >
          Pending Claims ({pendingClaims.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : activeTab === 'items' ? (
        <div>
          {pendingItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
              No pending items to review.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingItems.map(item => (
                <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3>{item.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.location} • {item.category}</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{item.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => handleItemAction(item.id, 'found')}>Approve</button>
                    <button className="btn btn-ghost" onClick={() => handleItemAction(item.id, 'rejected')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {pendingClaims.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
              No pending claims to review.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingClaims.map(claim => (
                <div key={claim.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3>Claim for: {claim.items?.name}</h3>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                      {new Date(claim.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '0.5rem' }}>
                    <strong>By:</strong> {claim.user_name} ({claim.user_email})
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '1rem' }}>
                    <strong>Proof:</strong> {claim.proof}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => handleClaimAction(claim.id, claim.item_id, 'approved')}>Approve</button>
                    <button className="btn btn-ghost" onClick={() => handleClaimAction(claim.id, claim.item_id, 'rejected')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
