import React from 'react';
import './styles/Timeline.css';

const Timeline = ({ data }) => {
  return (
    <div className="timeline">
      {data.map((record, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-content">
            <p>Start Time: {record.startTime.toLocaleString()}</p>
            <p>End Time: {record.endTime.toLocaleString()}</p>
            <p>Status: {record.status}</p>
            <p>Location: {record.location}</p>
            {record.remark && <p>Remark: {record.remark}</p>}
            {record.bolNumber && <p>BOL: {record.bolNumber}</p>}
            {record.trailerNumber && <p>Trailer: {record.trailerNumber}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;