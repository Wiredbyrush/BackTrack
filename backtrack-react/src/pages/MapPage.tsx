export default function MapPage() {
  const locations = [
    { name: 'Main Building', items: 12 },
    { name: 'Library', items: 8 },
    { name: 'Cafeteria', items: 15 },
    { name: 'Gym', items: 6 },
    { name: 'Science Building', items: 4 },
    { name: 'Art Building', items: 3 },
    { name: 'Parking Lot', items: 7 },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Campus Map</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        View lost items by location on campus.
      </p>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Interactive campus map coming soon!
        </p>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Items by Location</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {locations.map(loc => (
          <div key={loc.name} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>{loc.name}</h3>
            <p style={{ color: 'var(--accent-primary)', fontSize: 'var(--text-2xl)', fontWeight: '700' }}>
              {loc.items}
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>items found</p>
          </div>
        ))}
      </div>
    </div>
  );
}
