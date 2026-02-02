import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface BookRequest {
  id: string;
  title: string;
  author?: string;
  description?: string;
  requestedBy: string;
  requestedByEmail: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
  updatedAt?: number;
}

const AdminBookRequestsPage: NextPage = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      loadRequests();
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/admin/book-requests');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRequests(data.requests);
        }
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/book-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status,
          adminNotes: notes
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessageType('success');
        setMessage('Request updated successfully.');
        loadRequests();
        setEditingNotes(null);
        setNoteText('');
      } else {
        setMessageType('error');
        setMessage(result.message);
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Failed to update request.');
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const response = await fetch('/api/admin/book-requests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      const result = await response.json();

      if (result.success) {
        setMessageType('success');
        setMessage('Request deleted successfully.');
        loadRequests();
      } else {
        setMessageType('error');
        setMessage(result.message);
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Failed to delete request.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending: { backgroundColor: '#FFC107', color: '#000' },
      approved: { backgroundColor: '#4CAF50', color: '#fff' },
      rejected: { backgroundColor: '#F44336', color: '#fff' },
      completed: { backgroundColor: '#2196F3', color: '#fff' },
    };

    return (
      <span style={{
        ...styles[status],
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.85em',
        fontWeight: 'bold',
        textTransform: 'capitalize',
        display: 'inline-block'
      }}>
        {status}
      </span>
    );
  };

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <Layout>
      <div className="container">
        <h1>📚 Book Requests {pendingCount > 0 && <span style={{ color: '#FFC107' }}>({pendingCount} pending)</span>}</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <Link href="/admin/dashboard" style={{ color: '#2196F3' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

        {/* Filter */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="filter" style={{ marginRight: '10px' }}>Filter by status:</label>
          <select 
            id="filter"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '1em', borderRadius: '4px' }}
          >
            <option value="all">All ({requests.length})</option>
            <option value="pending">Pending ({requests.filter(r => r.status === 'pending').length})</option>
            <option value="approved">Approved ({requests.filter(r => r.status === 'approved').length})</option>
            <option value="completed">Completed ({requests.filter(r => r.status === 'completed').length})</option>
            <option value="rejected">Rejected ({requests.filter(r => r.status === 'rejected').length})</option>
          </select>
        </div>

        {isLoading ? (
          <p>Loading requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p>No book requests found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredRequests.map(request => (
              <div key={request.id} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '1.3em' }}>{request.title}</h3>
                    {request.author && (
                      <p style={{ margin: '0 0 5px 0', color: 'rgba(255, 255, 255, 0.7)' }}>
                        by {request.author}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {request.description && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#fff' }}>Details:</strong>
                    <p style={{ margin: '5px 0', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {request.description}
                    </p>
                  </div>
                )}

                <div style={{ marginBottom: '15px', fontSize: '0.9em', color: 'rgba(255, 255, 255, 0.6)' }}>
                  <p style={{ margin: '3px 0' }}>
                    <strong>Requested by:</strong> {request.requestedBy} ({request.requestedByEmail})
                  </p>
                  <p style={{ margin: '3px 0' }}>
                    <strong>Requested:</strong> {new Date(request.requestedAt).toLocaleString()}
                  </p>
                  {request.updatedAt && (
                    <p style={{ margin: '3px 0' }}>
                      <strong>Updated:</strong> {new Date(request.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Admin Notes Section */}
                {editingNotes === request.id ? (
                  <div style={{ marginBottom: '15px' }}>
                    <label htmlFor={`notes-${request.id}`} style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
                      Admin Notes:
                    </label>
                    <textarea
                      id={`notes-${request.id}`}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '10px', fontSize: '1em', fontFamily: 'inherit', marginBottom: '10px' }}
                      placeholder="Add notes visible to the user..."
                    />
                    <button 
                      onClick={() => updateStatus(request.id, request.status, noteText)}
                      className="btn"
                      style={{ marginRight: '10px', padding: '8px 16px' }}
                    >
                      Save Note
                    </button>
                    <button 
                      onClick={() => {
                        setEditingNotes(null);
                        setNoteText('');
                      }}
                      style={{ padding: '8px 16px', backgroundColor: '#666', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : request.adminNotes ? (
                  <div style={{
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderLeft: '3px solid #2196F3',
                    borderRadius: '4px'
                  }}>
                    <strong style={{ color: '#2196F3' }}>Admin Note:</strong>
                    <p style={{ margin: '5px 0', color: 'rgba(255, 255, 255, 0.9)' }}>
                      {request.adminNotes}
                    </p>
                    <button 
                      onClick={() => {
                        setEditingNotes(request.id);
                        setNoteText(request.adminNotes || '');
                      }}
                      style={{ 
                        marginTop: '5px',
                        padding: '5px 10px', 
                        fontSize: '0.85em',
                        backgroundColor: 'transparent',
                        color: '#2196F3',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Note
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setEditingNotes(request.id);
                      setNoteText('');
                    }}
                    style={{ 
                      marginBottom: '15px',
                      padding: '8px 12px', 
                      fontSize: '0.9em',
                      backgroundColor: 'transparent',
                      color: '#2196F3',
                      border: '1px solid #2196F3',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Note
                  </button>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {request.status !== 'pending' && (
                    <button 
                      onClick={() => updateStatus(request.id, 'pending')}
                      style={{ padding: '8px 16px', backgroundColor: '#FFC107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Mark Pending
                    </button>
                  )}
                  {request.status !== 'approved' && (
                    <button 
                      onClick={() => updateStatus(request.id, 'approved')}
                      style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Approve
                    </button>
                  )}
                  {request.status !== 'completed' && (
                    <button 
                      onClick={() => updateStatus(request.id, 'completed')}
                      style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Mark Completed
                    </button>
                  )}
                  {request.status !== 'rejected' && (
                    <button 
                      onClick={() => updateStatus(request.id, 'rejected')}
                      style={{ padding: '8px 16px', backgroundColor: '#F44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Reject
                    </button>
                  )}
                  <button 
                    onClick={() => deleteRequest(request.id)}
                    style={{ padding: '8px 16px', backgroundColor: '#666', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminBookRequestsPage;
