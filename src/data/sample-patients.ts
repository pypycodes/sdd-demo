import { Patient, CareEvent, CareEventStatus, CareEventCategory, UpcomingAppointment, BillingSummary, BillingItem } from '../types/care-journey';
import * as fs from 'fs';
import * as path from 'path';

/** JSON patient structure from patients.json */
interface JsonPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  email?: string;
  phone?: string;
  primaryDiagnosis: string;
  conditions: string[];
  allergies?: string[];
  medications?: string[];
  careTeam?: Array<{ name: string; role: string; phone: string }>;
  careEvents: Array<{
    id: string;
    date: string;
    category: string;
    title: string;
    description: string;
    provider: string;
    status: string;
    details?: string;
  }>;
  upcomingAppointments?: Array<{
    id: string;
    date: string;
    time: string;
    provider: string;
    specialty: string;
    type: string;
    location: string;
    reason: string;
    priorAuthRequired?: boolean;
  }>;
  billing?: {
    totalCharges: number;
    insurancePaid: number;
    adjustments: number;
    patientResponsibility: number;
    amountPaid: number;
    balanceDue: number;
    paymentPlanAvailable: boolean;
    items: Array<{
      service: string;
      date: string;
      provider: string;
      chargedAmount: number;
      insurancePaid: number;
      adjustments: number;
      patientResponsibility: number;
      status: 'paid' | 'pending' | 'overdue';
    }>;
  };
}

/** Load patients from JSON file */
function loadPatientsFromJson(): Patient[] {
  try {
    const jsonPath = path.join(__dirname, '../../public/patients.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(jsonContent) as { patients: JsonPatient[] };
    console.log(`Loaded ${data.patients.length} patients from JSON`);
    return data.patients.map((p): Patient => ({
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      primaryDiagnosis: p.primaryDiagnosis,
      conditions: p.conditions,
      careEvents: p.careEvents.map((e): CareEvent => ({
        id: e.id,
        date: e.date,
        category: e.category as CareEventCategory,
        title: e.title,
        description: e.description,
        provider: e.provider,
        status: e.status as CareEventStatus,
        details: e.details,
      })),
      upcomingAppointments: p.upcomingAppointments?.map((a): UpcomingAppointment => ({
        id: a.id,
        date: a.date,
        time: a.time,
        provider: a.provider,
        specialty: a.specialty,
        type: a.type,
        location: a.location,
        reason: a.reason,
        priorAuthRequired: a.priorAuthRequired,
      })),
      billing: p.billing ? {
        totalCharges: p.billing.totalCharges,
        insurancePaid: p.billing.insurancePaid,
        adjustments: p.billing.adjustments,
        patientResponsibility: p.billing.patientResponsibility,
        amountPaid: p.billing.amountPaid,
        balanceDue: p.billing.balanceDue,
        paymentPlanAvailable: p.billing.paymentPlanAvailable,
        items: p.billing.items.map((item): BillingItem => ({
          service: item.service,
          date: item.date,
          provider: item.provider,
          chargedAmount: item.chargedAmount,
          insurancePaid: item.insurancePaid,
          adjustments: item.adjustments,
          patientResponsibility: item.patientResponsibility,
          status: item.status,
        })),
      } : undefined,
    }));
  } catch (error) {
    console.error('Failed to load patients from JSON:', error);
    return [];
  }
}

/** All sample patients - loaded dynamically from JSON */
export const SAMPLE_PATIENTS: readonly Patient[] = loadPatientsFromJson();

/** Lookup patient by ID */
export function findPatientById(patientId: string): Patient | undefined {
  return SAMPLE_PATIENTS.find((p) => p.id === patientId);
}
