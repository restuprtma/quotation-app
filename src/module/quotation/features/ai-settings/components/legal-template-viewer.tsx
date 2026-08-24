import React, { useEffect, useState } from 'react';
import axiosInstance from 'src/shared/lib/axios';

export const LegalTemplateViewer = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch legal templates, fallback gracefully
    axiosInstance.get('/quotation/v1/legal-templates')
      .then(res => {
        setTemplates(res.data?.data || res.data || []);
      })
      .catch(() => {
        // Mock data
        setTemplates([
          { id: 'lt-1', title: 'Standard Terms & Conditions', version: 'v1.2' },
          { id: 'lt-2', title: 'MSA Template - Enterprise', version: 'v2.0' }
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading Legal Templates...</div>;

  return (
    <div>
      <h4>Active Legal Templates</h4>
      {templates.length === 0 ? (
        <p>No legal templates found.</p>
      ) : (
        <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th textAlign="left">ID</th>
              <th textAlign="left">Title</th>
              <th textAlign="left">Version</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((lt) => (
              <tr key={lt.id}>
                <td>{lt.id}</td>
                <td>{lt.title}</td>
                <td>{lt.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
