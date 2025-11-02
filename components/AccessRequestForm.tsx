import React, { useState } from 'react';

const AccessRequestForm = () => {
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!email || !reason) {
            setError('All fields are required.');
            return;
        }

        try {
            const response = await fetch('/api/access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, reason }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit request');
            }

            setSuccess(true);
            setEmail('');
            setReason('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Request Access to Plex Server</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>Request submitted successfully!</p>}
            <div>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="reason">Reason for Access:</label>
                <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Submit Request</button>
        </form>
    );
};

export default AccessRequestForm;