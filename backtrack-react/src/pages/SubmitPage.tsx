import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function SubmitPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    date_lost: ''
  });

  const categories = ['Electronics', 'Clothing', 'Accessories', 'Books', 'Keys', 'ID/Cards', 'Other'];
  const locations = ['Main Building', 'Library', 'Cafeteria', 'Gym', 'Science Building', 'Art Building', 'Parking Lot', 'Other'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      let imageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('items')
        .insert([{
          ...formData,
          image_url: imageUrl,
          user_id: user.id,
          status: 'pending'
        }]);

      if (insertError) throw insertError;

      navigate('/browse');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Report Found Item</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Help someone find their lost belongings by reporting what you found.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Item Photo</label>
          <div
            style={{
              border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-secondary)'
            }}
            onClick={() => document.getElementById('image-input')?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                <p style={{ color: 'var(--text-secondary)' }}>Click to upload an image</p>
              </>
            )}
          </div>
          <input
            id="image-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Item Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Blue Water Bottle"
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the item in detail..."
            rows={3}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Location Found *</label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Date Found</label>
          <input
            type="date"
            value={formData.date_lost}
            onChange={(e) => setFormData({ ...formData, date_lost: e.target.value })}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</p>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Item'}
        </button>
      </form>
    </div>
  );
}
