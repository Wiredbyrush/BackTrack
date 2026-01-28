import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Item } from '../lib/types';

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proof, setProof] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching item:', error);
    } else {
      setItem(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !item) return;

    setSubmitting(true);
    setError('');

    const { error: claimError } = await supabase
      .from('claims')
      .insert([{
        item_id: item.id,
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || user.email || '',
        proof,
        status: 'pending'
      }]);

    if (claimError) {
      setError(claimError.message);
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Item not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          This item may have been removed or doesn't exist.
        </p>
        <button onClick={() => navigate('/browse')} className="btn btn-primary" style={{ marginTop: '2rem' }}>
          Browse Items
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
        <h2>Claim Submitted!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Your claim has been submitted and is pending review. We'll notify you once it's processed.
        </p>
        <button onClick={() => navigate('/browse')} className="btn btn-primary" style={{ marginTop: '2rem' }}>
          Browse More Items
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Claim Item</h1>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
            />
          )}
          <div>
            <h2>{item.name}</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{item.description}</p>
            <p style={{ marginTop: '1rem' }}>
              <strong>Location:</strong> {item.location}
            </p>
            <p><strong>Category:</strong> {item.category}</p>
            <p><strong>Status:</strong> <span className={`status-${item.status}`}>{item.status}</span></p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Submit Your Claim</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Proof of Ownership *</label>
            <textarea
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="Describe how you can prove this item is yours (e.g., unique marks, contents, when/where you lost it)"
              required
              rows={5}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</p>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </form>
      </div>
    </div>
  );
}
