import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaMoneyBillWave, FaCheck, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


const CompactEventHistoryCard = ({ event }) => {
  const nav = useNavigate();
  
  
  const handleImageError = (e) => {
    console.warn(`Failed to load image: ${e.target.src}`);
    e.target.classList.add('image-error');
  };

  const getStatusStyle = (status) => {
    const statusLower = (status || '').toLowerCase();
    
    if (statusLower === 'approved' || statusLower === 'active') {
      return {
        backgroundColor: '#e3f9e8',
        color: '#1c8c45'
      };
    } else if (statusLower === 'rejected' || statusLower === 'declined') {
      return {
        backgroundColor: '#fde8e8',
        color: '#c53030'
      };
    } else {
      return {
        backgroundColor: '#e9f7fe',
        color: '#4ca1af'
      };
    }
  };


  const getStatusIcon = (status) => {
    const statusLower = (status || '').toLowerCase();
    
    if (statusLower === 'approved' || statusLower === 'active') {
      return <FaCheck style={{ marginRight: '3px', fontSize: '0.5rem' }} />;
    } else if (statusLower === 'rejected' || statusLower === 'declined') {
      return <FaTimes style={{ marginRight: '3px', fontSize: '0.5rem' }} />;
    }
    return null;
  };
  

  return (
    <div style={{
      width: '100%',
      height: '150px', 
      maxHeight: '150px',
      position: 'relative',
      backgroundColor: '#fff',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      margin: '5px',
      boxSizing: 'border-box'
    }}>
      {/* Image section - absolute positioned at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        overflow: 'hidden'
      }}>
        <img 
          src={event.file_url}  
          alt={event.event_name || 'Event'}
          style={{
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }}
          onError={handleImageError}
        />
        {!event.file_url && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#999',
            fontSize: '0.7rem'
          }}>
            <span>No Image</span>
          </div>
        )}
      </div>

      {/* Title - absolute positioned below image */}
      <div style={{
        position: 'absolute',
        top: '52px',
        left: '8px',
        right: '8px',
        height: '14px',
      }}>
        <h3 style={{
          margin: 0,
          padding: 0,
          fontSize: '0.7rem',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: '#2c3e50'
        }}>
          {event.event_name || 'Unnamed Event'}
        </h3>
      </div>

      {/* Location info */}
      <div style={{
        position: 'absolute',
        top: '68px',
        left: '8px',
        right: '8px',
        height: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.6rem',
          color: '#555'
        }}>
          <FaMapMarkerAlt style={{width: '8px', height: '8px', marginRight: '3px'}} />
          <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {event.location || event.venue || 'Location not specified'}
          </span>
        </div>
      </div>

      {/* Date/Time info */}
      <div style={{
        position: 'absolute',
        top: '82px',
        left: '8px',
        right: '8px',
        height: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.6rem',
          color: '#555'
        }}>
          <FaCalendarAlt style={{width: '8px', height: '8px', marginRight: '3px'}} />
          <span style={{marginRight: '5px'}}>{event.date || 'TBD'}</span>
          <FaClock style={{width: '8px', height: '8px', marginRight: '3px', marginLeft: '3px'}} />
          <span>{event.time || 'TBD'}</span>
        </div>
      </div>

      {/* Price info */}
      <div style={{
        position: 'absolute',
        top: '96px',
        left: '8px',
        right: '8px',
        height: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.6rem',
          color: '#555'
        }}>
          <FaMoneyBillWave style={{width: '8px', height: '8px', marginRight: '3px'}} />
          <span>{event.price || 'Free'}</span>
        </div>
      </div>

      {/* Status badge and action button - fixed at bottom */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        right: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          ...getStatusStyle(event.status),
          borderRadius: '10px',
          padding: '1px 4px',
          fontSize: '0.6rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          {getStatusIcon(event.status)}
          {event.status || 'Unknown'}
        </span>
        
        <button 
          onClick={() => nav('/adminvieweventrequest', { state: { eventid: event.eventid || event.id || event.event_id } })} 
          style={{
            backgroundColor: '#4ca1af',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            padding: '2px 5px',
            fontSize: '0.6rem',
            cursor: 'pointer'
          }}
        >
          View
        </button>
      </div>
    </div>
  );
};

export default CompactEventHistoryCard;
