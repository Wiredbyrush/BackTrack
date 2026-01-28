export default function FeaturesPage() {
  const features = [
    {
      icon: '🔍',
      title: 'AI-Powered Search',
      description: 'Our semantic search understands what you\'re looking for, even with vague descriptions.'
    },
    {
      icon: '📸',
      title: 'Image Matching',
      description: 'Upload a photo of your item and our AI will find similar items in the database.'
    },
    {
      icon: '🤖',
      title: 'Smart Chatbot',
      description: 'Get instant help finding your items with our AI assistant.'
    },
    {
      icon: '🗺️',
      title: 'Location Tracking',
      description: 'See where items were found on an interactive campus map.'
    },
    {
      icon: '🔔',
      title: 'Real-time Notifications',
      description: 'Get notified instantly when someone finds your lost item.'
    },
    {
      icon: '🔒',
      title: 'Secure Claims',
      description: 'Verification system ensures items go to their rightful owners.'
    },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="text-gradient" style={{ marginBottom: '1rem' }}>Features</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          BackTrack uses cutting-edge AI technology to help you find lost items faster than ever before.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {features.map((feature, index) => (
          <div key={index} className="card" style={{ padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
            <h3 style={{ marginBottom: '0.5rem' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '3rem', textAlign: 'center', marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Built for FBLA</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          BackTrack was developed as a solution for the FBLA Coding & Programming competition,
          demonstrating advanced programming concepts including AI integration, database management,
          and modern web development practices.
        </p>
      </div>
    </div>
  );
}
