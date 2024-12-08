// src/components/LogDisplay.jsx
import React from 'react';

export const LogDisplay = ({ processedData }) => {
    const { events, violations } = processedData;

    return (
        <div className="log-display">
            <div className="violations-section">
                <h3>Violations Found</h3>
                {violations.map((violation, index) => (
                    <div key={index} className="violation-item">
                        <span className="violation-type">{violation.type}</span>
                        <span className="violation-time">
                            {violation.event.startTime.toLocaleString()}
                        </span>
                        {violation.duration && (
                            <span className="violation-duration">
                                Duration: {Math.round(violation.duration)} minutes
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <div className="events-section">
                <h3>Chronological Events</h3>
                {events.map((event, index) => (
                    <div key={index} className={`event-item ${event.eventType.toLowerCase().replace(' ', '-')}`}>
                        <div className="event-time">
                            {event.startTime.toLocaleString()}
                        </div>
                        <div className="event-type">
                            {event.eventType}
                        </div>
                        <div className="event-location">
                            {event.location?.landmark} - {event.location?.place}
                        </div>
                        {event.eventType === 'ON DUTY' && (
                            <div className="event-note">
                                Note: {event.note || 'Missing'}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};