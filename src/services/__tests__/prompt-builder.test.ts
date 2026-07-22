import { buildSystemPrompt, buildUserPrompt } from '../prompt-builder';
import { Patient } from '../../types/care-journey';

describe('prompt-builder', () => {
  describe('buildSystemPrompt', () => {
    it('should return a non-empty string', () => {
      const prompt = buildSystemPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should include critical safety rules', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('CRITICAL SAFETY RULES');
      expect(prompt).toContain('NOT a doctor');
      expect(prompt).toContain('NEVER suggest');
    });

    it('should instruct second-person address', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('you');
      expect(prompt).toContain('your');
    });

    it('should request JSON-only responses', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('Respond ONLY with valid JSON');
    });
  });

  describe('buildUserPrompt', () => {
    const basePatient: Patient = {
      id: 'P-TEST',
      name: 'Test Patient',
      age: 45,
      gender: 'Female',
      primaryDiagnosis: 'Hypertension',
      conditions: ['Hypertension', 'High Cholesterol'],
      careEvents: [
        {
          id: 'ce1',
          date: '2026-01-01',
          category: 'visit',
          title: 'Annual Physical',
          description: 'Routine checkup',
          provider: 'Dr. Smith',
          status: 'completed',
        },
        {
          id: 'ce2',
          date: '2025-06-01',
          category: 'lab',
          title: 'Blood Panel',
          description: 'Lipid panel',
          provider: 'Lab Corp',
          status: 'overdue',
        },
      ],
    };

    it('should include patient profile fields', () => {
      const prompt = buildUserPrompt(basePatient);
      expect(prompt).toContain('Test Patient');
      expect(prompt).toContain('45');
      expect(prompt).toContain('Female');
      expect(prompt).toContain('Hypertension');
    });

    it('should sort and format the care timeline chronologically', () => {
      const prompt = buildUserPrompt(basePatient);
      const labIndex = prompt.indexOf('Blood Panel');
      const visitIndex = prompt.indexOf('Annual Physical');
      // 2025-06-01 (Blood Panel) should appear before 2026-01-01 (Annual Physical)
      expect(labIndex).toBeGreaterThan(-1);
      expect(visitIndex).toBeGreaterThan(-1);
      expect(labIndex).toBeLessThan(visitIndex);
    });

    it('should show "None scheduled" when there are no upcoming appointments', () => {
      const prompt = buildUserPrompt(basePatient);
      expect(prompt).toContain('None scheduled');
    });

    it('should format upcoming appointments when present', () => {
      const patientWithAppt: Patient = {
        ...basePatient,
        upcomingAppointments: [
          {
            id: 'apt1',
            date: '2026-08-01',
            time: '10:00 AM',
            provider: 'Dr. Jones',
            specialty: 'Cardiology',
            type: 'Follow-up',
            location: 'Main Clinic',
            reason: 'Blood pressure check',
          },
        ],
      };
      const prompt = buildUserPrompt(patientWithAppt);
      expect(prompt).toContain('Dr. Jones');
      expect(prompt).toContain('Cardiology');
      expect(prompt).toContain('appointmentPrep');
    });

    it('should flag prior auth required appointments', () => {
      const patientWithPriorAuth: Patient = {
        ...basePatient,
        upcomingAppointments: [
          {
            id: 'apt2',
            date: '2026-09-01',
            time: '2:00 PM',
            provider: 'Dr. Lee',
            specialty: 'Radiology',
            type: 'Imaging',
            location: 'Imaging Center',
            reason: 'MRI',
            priorAuthRequired: true,
          },
        ],
      };
      const prompt = buildUserPrompt(patientWithPriorAuth);
      expect(prompt).toContain('[Prior Auth Required]');
    });

    it('should show "No billing information available" when billing is absent', () => {
      const prompt = buildUserPrompt(basePatient);
      expect(prompt).toContain('No billing information available');
    });

    it('should format billing summary and request costExplainer when balance is due', () => {
      const patientWithBilling: Patient = {
        ...basePatient,
        billing: {
          totalCharges: 1000,
          insurancePaid: 800,
          adjustments: 50,
          patientResponsibility: 150,
          amountPaid: 50,
          balanceDue: 100,
          paymentPlanAvailable: true,
          items: [
            {
              service: 'Office Visit',
              date: '2026-01-01',
              provider: 'Dr. Smith',
              chargedAmount: 200,
              insurancePaid: 150,
              adjustments: 0,
              patientResponsibility: 50,
              status: 'paid',
            },
          ],
        },
      };
      const prompt = buildUserPrompt(patientWithBilling);
      expect(prompt).toContain('Total Charges: $1000.00');
      expect(prompt).toContain('Balance Due: $100.00');
      expect(prompt).toContain('Payment Plan Available: Yes');
      expect(prompt).toContain('Office Visit');
      expect(prompt).toContain('costExplainer');
    });

    it('should NOT request costExplainer when balance due is zero', () => {
      const patientWithZeroBalance: Patient = {
        ...basePatient,
        billing: {
          totalCharges: 500,
          insurancePaid: 500,
          adjustments: 0,
          patientResponsibility: 0,
          amountPaid: 0,
          balanceDue: 0,
          paymentPlanAvailable: false,
          items: [],
        },
      };
      const prompt = buildUserPrompt(patientWithZeroBalance);
      expect(prompt).not.toContain('costExplainer');
    });

    it('should include today\'s date', () => {
      const prompt = buildUserPrompt(basePatient);
      const today = new Date().toISOString().split('T')[0];
      expect(prompt).toContain(today);
    });

    it('should always request the base JSON schema fields', () => {
      const prompt = buildUserPrompt(basePatient);
      expect(prompt).toContain('currentPhase');
      expect(prompt).toContain('journeySummary');
      expect(prompt).toContain('nextBestActions');
      expect(prompt).toContain('careGaps');
      expect(prompt).toContain('progressPercentage');
    });
  });
});
