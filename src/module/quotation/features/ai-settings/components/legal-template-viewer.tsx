import React, { useEffect, useState } from 'react';
import axiosInstance from 'src/shared/lib/axios';

interface LegalTemplate {
  id: string;
  title: string;
  version: string;
}

export const LegalTemplateViewer = () => {
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch legal templates, fallback gracefully
    axiosInstance.get('/quotation/v1/legal-templates?status=active')
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
              <th style={{ textAlign: 'left' }}>ID</th>
              <th style={{ textAlign: 'left' }}>Title</th>
              <th style={{ textAlign: 'left' }}>Version</th>
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
