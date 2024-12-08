// src/services/LogAnalyzer.js

export class LogAnalyzer {
    parseEventData(record) {
        return {
            startTime: this.parseStartTime(record),
            eventType: this.parseEventType(record),
            location: this.parseLocation(record),
            odometer: this.parseOdometer(record),
            engineHours: this.parseEngineHours(record),
            note: this.parseNote(record)
        };
    }

    parseStartTime(record) {
        // Handle both time formats
        const timeString = record.timeString || '';
        
        // Format 1: "6:44am"
        const format1Regex = /(\d{1,2}:\d{2}(?:am|pm))/i;
        
        // Format 2: "Dec 01, 05:53:07 am"
        const format2Regex = /([A-Za-z]{3}\s\d{2},\s\d{2}:\d{2}:\d{2}\s(?:am|pm))/i;

        try {
            if (format1Regex.test(timeString)) {
                return new Date(`1970/01/01 ${timeString}`);
            } else if (format2Regex.test(timeString)) {
                return new Date(timeString);
            }
            return null;
        } catch (error) {
            console.error('Time parsing error:', error);
            return null;
        }
    }

    parseEventType(record) {
        const eventTypes = {
            'ON DUTY': 'onDuty',
            'OFF DUTY': 'offDuty',
            'DRIVING': 'driving',
            'INTERMEDIATE': 'intermediate',
            'SLEEPER': 'sleeper',
            'PERSONAL USE': 'personalUse'
        };
        return eventTypes[record.status?.toUpperCase()] || 'unknown';
    }

    parseLocation(record) {
        const locationRegex = /\((.*?)\)(.*?)(?:,\s*[A-Z]{2},\s*US)/;
        const match = record.location?.match(locationRegex);
        
        if (match) {
            return {
                landmark: match[1].trim(),
                place: match[2].trim()
            };
        }
        return null;
    }

    parseOdometer(record) {
        return parseFloat(record.odometer) || 0;
    }

    parseEngineHours(record) {
        return parseFloat(record.engineHours) || 0;
    }

    parseNote(record) {
        const noteRegex = /US,\s*(.+)$/;
        const match = record.location?.match(noteRegex);
        return match ? match[1].trim() : '';
    }
}

// src/services/EventAnalytics.js

export class EventAnalytics {
    constructor(logAnalyzer) {
        this.logAnalyzer = logAnalyzer;
    }

    analyzeEvents(records) {
        const analyzedData = records.map(record => this.logAnalyzer.parseEventData(record));
        
        return {
            timelineData: this.generateTimeline(analyzedData),
            statistics: this.calculateStatistics(analyzedData),
            violations: this.checkViolations(analyzedData),
            patterns: this.identifyPatterns(analyzedData)
        };
    }

    generateTimeline(analyzedData) {
        // Generate timeline visualization data
        return analyzedData.map(data => ({
            time: data.startTime,
            type: data.eventType,
            location: data.location,
            details: {
                odometer: data.odometer,
                engineHours: data.engineHours,
                note: data.note
            }
        }));
    }

    calculateStatistics(analyzedData) {
        // Calculate various statistics from the data
        return {
            totalDrivingHours: this.calculateTotalDrivingHours(analyzedData),
            totalDistance: this.calculateTotalDistance(analyzedData),
            eventCounts: this.countEventTypes(analyzedData)
        };
    }

    checkViolations(analyzedData) {
        // Check for various violations
        return {
            timeViolations: this.checkTimeViolations(analyzedData),
            locationViolations: this.checkLocationViolations(analyzedData),
            documentationViolations: this.checkDocumentationViolations(analyzedData)
        };
    }

    identifyPatterns(analyzedData) {
        // Identify patterns in the data
        return {
            commonLocations: this.findCommonLocations(analyzedData),
            routePatterns: this.analyzeRoutes(analyzedData),
            timePatterns: this.analyzeTimePatterns(analyzedData)
        };
    }
}