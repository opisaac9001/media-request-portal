import React, { useState } from 'react';

const MediaRequestForm = () => {
    const [mediaTitle, setMediaTitle] = useState('');
    const [mediaType, setMediaType] = useState('show');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!mediaTitle) {
            setError('Media title is required');
            return;
        }
        setError('');
        // Logic to handle media request submission goes here
        console.log(`Requesting ${mediaType}: ${mediaTitle}`);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Request a Show or Movie</h2>
            <div>
                <label>
                    Media Title:
                    <input
                        type="text"
                        value={mediaTitle}
                        onChange={(e) => setMediaTitle(e.target.value)}
                    />
                </label>
            </div>
            <div>
                <label>
                    Media Type:
                    <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value)}
                    >
                        <option value="show">Show</option>
                        <option value="movie">Movie</option>
                    </select>
                </label>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">Submit Request</button>
        </form>
    );
};

export default MediaRequestForm;