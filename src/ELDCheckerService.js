// Enum for duty types
export const OnDutyType = {
    PTI: "pti",
    DELIVERY: "delivery",
    PICKUP: "pickup",
    LOADING: "loading",
    FUEL: "fuel",
    UNKNOWN: "unknown"
  };
  
  // Class for driving records
  export class DrivingRecord {
    constructor({
      startTime,
      endTime,
      status,
      location,
      vehicleId,
      remark = '',
      bolNumber = '',
      trailerNumber = '',
      isCertified = false
    }) {
      this.startTime = new Date(startTime);
      this.endTime = new Date(endTime);
      this.status = status;
      this.location = location;
      this.vehicleId = vehicleId;
      this.remark = remark;
      this.bolNumber = bolNumber;
      this.trailerNumber = trailerNumber;
      this.isCertified = isCertified;
    }
  }
  
  export class EnhancedFMCSAChecker {
    constructor() {
      // FMCSA limits
      this.DRIVING_LIMIT = 11;
      this.ON_DUTY_LIMIT = 14;
      this.OFF_DUTY_MINIMUM = 10;
      this.CYCLE_HOURS = 70;
      this.CYCLE_DAYS = 8;
      
      // Duration requirements
      this.MIN_PTI_TIME = 15;  // minutes
      this.MIN_LOADING_TIME = 17;  // minutes
      
      // Keywords for identifying On Duty types
      this.ON_DUTY_KEYWORDS = {
        [OnDutyType.PTI]: ["pti", "pre-trip", "pretrip", "pre trip"],
        [OnDutyType.DELIVERY]: ["delivery", "unload", "receiving"],
        [OnDutyType.PICKUP]: ["pickup", "pick up", "loading"],
        [OnDutyType.LOADING]: ["shipper", "receiver", "at dock"],
        [OnDutyType.FUEL]: ["fuel"]
      };
    }
  
    checkAllViolations(records) {
      return {
        ...this.checkBasicHOSViolations(records),
        ...this.checkOnDutyDurationViolations(records)
      };
    }
  
    checkOnDutyDurationViolations(records) {
      const violations = {
        pti_duration_violations: [],
        loading_duration_violations: [],
        missing_remark_violations: [],
        multiple_violations: []
      };
  
      const onDutyRecords = records.filter(r => r.status.toLowerCase() === 'on duty');
      
      for (const record of onDutyRecords) {
        const durationMinutes = (record.endTime - record.startTime) / (1000 * 60);
        const dutyType = this.identifyOnDutyType(record.remark);
        
        // Check violations based on type
        this.checkViolationsByType(record, durationMinutes, dutyType, violations);
      }
  
      return violations;
    }
  
    identifyOnDutyType(remark) {
      if (!remark) return OnDutyType.UNKNOWN;
      
      const remarkLower = remark.toLowerCase();
      
      for (const [dutyType, keywords] of Object.entries(this.ON_DUTY_KEYWORDS)) {
        if (keywords.some(keyword => remarkLower.includes(keyword))) {
          return dutyType;
        }
      }
      
      return OnDutyType.UNKNOWN;
    }
  
    checkViolationsByType(record, duration, dutyType, violations) {
      if (dutyType === OnDutyType.PTI && duration < this.MIN_PTI_TIME) {
        violations.pti_duration_violations.push({
          timestamp: record.startTime,
          location: record.location,
          duration: duration,
          required: this.MIN_PTI_TIME,
          remark: record.remark
        });
      } else if ([OnDutyType.DELIVERY, OnDutyType.PICKUP, OnDutyType.LOADING].includes(dutyType)) {
        if (duration < this.MIN_LOADING_TIME) {
          violations.loading_duration_violations.push({
            timestamp: record.startTime,
            location: record.location,
            type: dutyType,
            duration: duration,
            required: this.MIN_LOADING_TIME,
            remark: record.remark
          });
        }
      }
  
      if (duration >= this.MIN_LOADING_TIME && dutyType === OnDutyType.UNKNOWN) {
        violations.missing_remark_violations.push({
          timestamp: record.startTime,
          location: record.location,
          duration: duration,
          remark: record.remark || "No remark"
        });
      }
    }
  }
  
  export default EnhancedFMCSAChecker;