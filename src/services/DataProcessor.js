// src/services/DataProcessor.js
export class DataProcessor {
    processELDData(pdfData) {
        // 1. Extract and parse events
        const events = this.extractEvents(pdfData);
        
        // 2. Sort by chronological order
        const sortedEvents = this.sortChronologically(events);
        
        // 3. Check On Duty violations
        const validatedEvents = this.validateOnDutyEvents(sortedEvents);

        return validatedEvents;
    }

    extractEvents(pdfData) {
        return pdfData.map(record => ({
            startTime: this.parseDateTime(record.startTime),
            eventType: record.status,
            location: this.parseLocation(record.location),
            odometer: record.odometer,
            engineHours: record.engineHours,
            note: this.extractNote(record.location || ''),
            original: record // Keep original data for reference
        }));
    }

    parseDateTime(timeStr) {
        // Handle both formats
        const format1 = /(\d{1,2}:\d{2}(?:am|pm))/i;
        const format2 = /([A-Za-z]{3}\s\d{2},\s\d{2}:\d{2}:\d{2}\s(?:am|pm))/i;
        
        try {
            if (format1.test(timeStr)) {
                return new Date(`1970/01/01 ${timeStr}`);
            } else if (format2.test(timeStr)) {
                return new Date(timeStr);
            }
        } catch (error) {
            console.error('DateTime parsing error:', error);
        }
        return null;
    }

    parseLocation(locationStr) {
        const match = locationStr?.match(/\((.*?)\)(.*?)(?:,\s*[A-Z]{2},\s*US)/);
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
            if (event.eventType.toUpperCase() === 'ON DUTY') {
                // Check for missing note
                if (!event.note) {
                    violations.push({
                        type: 'MISSING_NOTE',
                        event: event
                    });
                }

                // Check duration if next event exists
                if (index < events.length - 1) {
                    const duration = (events[index + 1].startTime - event.startTime) / (1000 * 60); // in minutes
                    if (duration > 17) {
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