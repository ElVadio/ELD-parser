export class DataProcessor {
    constructor() {
      this.MIN_ON_DUTY_TIME = 17; // minutes
    }
  
    processELDData(pdfData) {
      try {
        const events = this.extractEvents(pdfData);
        const sortedEvents = this.sortChronologically(events);
        const validatedEvents = this.validateOnDutyEvents(sortedEvents);
        return validatedEvents;
      } catch (error) {
        console.error('Error processing ELD data:', error);
        throw error;
      }
    }
  
    extractEvents(pdfData) {
      return pdfData.map(record => ({
        startTime: this.parseDateTime(record.startTime),
        eventType: record.status,
        location: this.parseLocation(record.fullLocation || ''),
        note: this.extractNote(record.fullLocation || ''),
        originalData: record
      }));
    }
  
    parseDateTime(timeStr) {
        try {
          if (!timeStr) return 'Invalid Date';
          
          const date = new Date(timeStr);
          if (isNaN(date.getTime())) {
            // Try parsing different format
            const [datePart, timePart] = timeStr.split(' ');
            if (datePart && timePart) {
              return new Date(`${datePart} ${timePart}`);
            }
            return 'Invalid Date Format';
          }
          return date;
        } catch (error) {
          console.error('DateTime parsing error:', error);
          return 'Error Parsing Date';
        }
      }
  
    parseLocation(locationStr) {
      const match = locationStr.match(/\((.*?)\)(.*?)(?:,\s*[A-Z]{2},\s*US)/);
      return match ? {
        landmark: match[1].trim(),
        place: match[2].trim()
      } : null;
    }
  
    extractNote(locationStr) {
      const match = locationStr.match(/US,\s*(.+)$/);
      return match ? match[1].trim() : '';
    }
  
    sortChronologically(events) {
      return [...events].sort((a, b) => a.startTime - b.startTime);
    }
  
    validateOnDutyEvents(events) {
      const violations = [];
      
      events.forEach((event, index) => {
        if (event.eventType === 'ON DUTY') {
          // Check for missing note
          if (!event.note) {
            violations.push({
              type: 'MISSING_NOTE',
              event: event
            });
          }
  
          // Check duration if next event exists
          if (index < events.length - 1) {
            const duration = (events[index + 1].startTime - event.startTime) / (1000 * 60);
            if (duration > this.MIN_ON_DUTY_TIME) {
              violations.push({
                type: 'DURATION_EXCEEDED',
                event: event,
                duration: duration
              });
            }
          }
        }
      });
  
      return {
        events,
        violations
      };
    }
  }
  
  export default DataProcessor;