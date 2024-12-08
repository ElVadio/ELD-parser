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
      try {
          const basicViolations = this.checkBasicHOSViolations(records);
          const durationViolations = this.checkOnDutyDurationViolations(records);
          return {
              ...basicViolations,
              ...durationViolations
          };
      } catch (error) {
          console.error('Error in checkAllViolations:', error);
          throw error;
      }
  }

  checkBasicHOSViolations(records) {
      const violations = {
          driving_limit_violations: [],
          on_duty_limit_violations: [],
          off_duty_minimum_violations: [],
          cycle_hours_violations: []
      };

      try {
          if (!Array.isArray(records)) {
              throw new Error('Records must be an array');
          }

          let drivingHours = 0;
          let onDutyHours = 0;

          records.forEach((record, index) => {
              const duration = (record.endTime - record.startTime) / (1000 * 60 * 60);

              // Check driving time violations
              if (record.status === 'DRIVING') {
                  drivingHours += duration;
                  if (drivingHours > this.DRIVING_LIMIT) {
                      violations.driving_limit_violations.push({
                          timestamp: record.startTime,
                          location: record.location,
                          duration: duration,
                          total_hours: drivingHours
                      });
                  }
              }

              // Check on-duty time violations
              if (record.status === 'ON DUTY' || record.status === 'DRIVING') {
                  onDutyHours += duration;
                  if (onDutyHours > this.ON_DUTY_LIMIT) {
                      violations.on_duty_limit_violations.push({
                          timestamp: record.startTime,
                          location: record.location,
                          duration: duration,
                          total_hours: onDutyHours
                      });
                  }
              }
          });

          return violations;
      } catch (error) {
          console.error('Error in checkBasicHOSViolations:', error);
          throw error;
      }
  }

  checkOnDutyDurationViolations(records) {
      const violations = {
          pti_duration_violations: [],
          loading_duration_violations: [],
          missing_remark_violations: []
      };

      try {
          records.forEach(record => {
              if (record.status === 'ON DUTY') {
                  const durationMinutes = (record.endTime - record.startTime) / (1000 * 60);
                  
                  // Check PTI violations
                  if (record.remark?.toLowerCase().includes('pti') && 
                      durationMinutes < this.MIN_PTI_TIME) {
                      violations.pti_duration_violations.push({
                          timestamp: record.startTime,
                          location: record.location,
                          duration: durationMinutes,
                          required: this.MIN_PTI_TIME
                      });
                  }

                  // Check loading/unloading violations
                  if (record.remark?.toLowerCase().match(/load|unload|delivery|pickup/) && 
                      durationMinutes < this.MIN_LOADING_TIME) {
                      violations.loading_duration_violations.push({
                          timestamp: record.startTime,
                          location: record.location,
                          duration: durationMinutes,
                          required: this.MIN_LOADING_TIME
                      });
                  }
              }
          });

          return violations;
      } catch (error) {
          console.error('Error in checkOnDutyDurationViolations:', error);
          throw error;
      }
  }
}

export default EnhancedFMCSAChecker;