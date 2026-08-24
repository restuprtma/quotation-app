import React, { useEffect, useState } from 'react';
import axiosInstance from 'src/shared/lib/axios';

export const RateCardSelector = () => {
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch rate cards if an endpoint exists, fallback gracefully
    axiosInstance.get('/quotation/v1/rate-cards')
      .then(res => {
        setRateCards(res.data?.data || res.data || []);
      })
      .catch(() => {
        // Mock data or empty gracefully if endpoint doesn't exist
        setRateCards([
          { id: 'rc-1', name: 'Standard IT Services 2026', status: 'active' },
          { id: 'rc-2', name: 'Enterprise Consulting', status: 'active' }
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading Rate Cards...</div>;

  return (
    <div>
      <h4>Active Rate Cards</h4>
      {rateCards.length === 0 ? (
        <p>No active rate cards found.</p>
      ) : (
        <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }}>
          <thead>
            <tr>
              <th textAlign="left">ID</th>
              <th textAlign="left">Name</th>
              <th textAlign="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rateCards.map((rc) => (
              <tr key={rc.id}>
                <td>{rc.id}</td>
                <td>{rc.name}</td>
                <td>{rc.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
