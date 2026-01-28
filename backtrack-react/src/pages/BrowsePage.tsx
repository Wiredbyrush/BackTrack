import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Item } from '../lib/types';
import styles from './BrowsePage.module.css';

export default function BrowsePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');

  const categories = ['Electronics', 'Clothing', 'Accessories', 'Books', 'Keys', 'ID/Cards', 'Other'];

  useEffect(() => {
    fetchItems();
  }, [category]);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase
      .from('items')
      .select('*')
      .in('status', ['found', 'claimed'])
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Browse Lost Items</h1>
          <p>Find your lost belongings from our collection of found items.</p>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <input
              type="search"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.categories}>
            <button
              className={`${styles.categoryBtn} ${!category ? styles.active : ''}`}
              onClick={() => setCategory('')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`${styles.categoryBtn} ${category === cat ? styles.active : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className="spinner" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.empty}>
            <p>No items found matching your search.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredItems.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardImage}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div className={styles.noImage}>No Image</div>
                  )}
                  <span className={`${styles.status} ${styles[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <div className={styles.cardContent}>
                  <h3>{item.name}</h3>
                  <p className={styles.location}>{item.location}</p>
                  <p className={styles.date}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  <Link to={`/claim/${item.id}`} className="btn btn-primary">
                    Claim Item
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
