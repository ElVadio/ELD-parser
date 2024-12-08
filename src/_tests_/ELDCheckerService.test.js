import { EnhancedFMCSAChecker, DrivingRecord } from '../ELDCheckerService';

describe('ELDCheckerService', () => {
  let checker;

  beforeEach(() => {
    checker = new EnhancedFMCSAChecker();
  });

  test('should identify PTI violation when duration is less than 15 minutes', () => {
    const records = [
      new DrivingRecord({
        startTime: new Date('2024-01-01T08:00:00'),
        endTime: new Date('2024-01-01T08:10:00'), // 10 minutes
        status: 'on duty',
        location: 'Test Location',
        vehicleId: '123',
        remark: 'pti',
      })
    ];

    const violations = checker.check_all_violations(records);
    expect(violations.pti_duration_violations).toHaveLength(1);
    expect(violations.pti_duration_violations[0].duration).toBe(10);
  });

  test('should identify loading violation when duration is less than 17 minutes', () => {
    const records = [
      new DrivingRecord({
        startTime: new Date('2024-01-01T08:00:00'),
        endTime: new Date('2024-01-01T08:15:00'), // 15 minutes
        status: 'on duty',
        location: 'Test Location',
        vehicleId: '123',
        remark: 'loading',
      })
    ];

    const violations = checker.check_all_violations(records);
    expect(violations.loading_duration_violations).toHaveLength(1);
  });

  test('should detect missing remarks for extended stops', () => {
    const records = [
      new DrivingRecord({
        startTime: new Date('2024-01-01T08:00:00'),
        endTime: new Date('2024-01-01T08:30:00'), // 30 minutes
        status: 'on duty',
        location: 'Test Location',
        vehicleId: '123',
        remark: '',
      })
    ];

    const violations = checker.check_all_violations(records);
    expect(violations.missing_remark_violations).toHaveLength(1);
  });

  test('should not report violations for compliant records', () => {
    const records = [
      new DrivingRecord({
        startTime: new Date('2024-01-01T08:00:00'),
        endTime: new Date('2024-01-01T08:20:00'), // 20 minutes
        status: 'on duty',
        location: 'Test Location',
        vehicleId: '123',
        remark: 'pti',
      })
    ];

    const violations = checker.check_all_violations(records);
    expect(violations.pti_duration_violations).toHaveLength(0);
    expect(violations.loading_duration_violations).toHaveLength(0);
    expect(violations.missing_remark_violations).toHaveLength(0);
  });
});