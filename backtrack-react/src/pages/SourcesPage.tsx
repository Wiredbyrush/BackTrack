export default function SourcesPage() {
  const sources = [
    {
      category: 'Frontend Framework',
      items: [
        { name: 'React', url: 'https://react.dev', description: 'UI library for building user interfaces' },
        { name: 'Vite', url: 'https://vitejs.dev', description: 'Next-generation frontend build tool' },
        { name: 'React Router', url: 'https://reactrouter.com', description: 'Client-side routing for React' },
      ]
    },
    {
      category: 'Backend & Database',
      items: [
        { name: 'Supabase', url: 'https://supabase.com', description: 'Open-source Firebase alternative with PostgreSQL' },
        { name: 'PostgreSQL', url: 'https://postgresql.org', description: 'Advanced open-source relational database' },
      ]
    },
    {
      category: 'AI & Machine Learning',
      items: [
        { name: 'OpenAI', url: 'https://openai.com', description: 'GPT models for chatbot and semantic search' },
        { name: 'pgvector', url: 'https://github.com/pgvector/pgvector', description: 'Vector similarity search for PostgreSQL' },
      ]
    },
    {
      category: 'Design & Styling',
      items: [
        { name: 'CSS Custom Properties', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/--*', description: 'Native CSS variables for theming' },
        { name: 'Inter Font', url: 'https://rsms.me/inter/', description: 'Professional typeface for UI' },
      ]
    },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Sources & Credits</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Technologies and resources used to build BackTrack.
      </p>

      {sources.map((section, index) => (
        <div key={index} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
            {section.category}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="card" style={{ padding: '1rem' }}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: '600', marginRight: '0.5rem' }}
                >
                  {item.name} ↗
                </a>
                <span style={{ color: 'var(--text-secondary)' }}>{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>License</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          This project was created for the FBLA Coding & Programming competition.
          All code is original work unless otherwise noted above.
        </p>
      </div>
    </div>
  );
}
