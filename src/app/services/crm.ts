import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface LeadType {
  id?: number;
  name: string;
  description?: string;
}

export interface CustomerLead {
  id?: number;
  customerName: string;
  mobile: string;
  alternateNumber?: string;
  email?: string;
  leadType: LeadType;
  city?: string;
  address?: string;
  requirement?: string;
  leadSource?: string;
  assignedExecutive?: string;
  discussionDetails?: string;
  visitDate?: string;
  nextFollowupDate?: string;
  status: string;
  priority: string;
  createdDate?: string;
}

export interface FollowUp {
  id?: number;
  followupDate?: string;
  discussionDetails?: string;
  nextFollowupDate?: string;
  status: string;
  priority: string;
  executive: string;
}

export interface Note {
  id?: number;
  noteText: string;
  createdDate?: string;
  createdBy?: string;
}

export interface DashboardStats {
  totalLeads: number;
  todayFollowups: number;
  pendingFollowups: number;
  hotCustomers: number;
  closedWonDeals: number;
  closedLostDeals: number;
  leadsByStatus: { [key: string]: number };
  leadsByPriority: { [key: string]: number };
  leadsBySector: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class CRMService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    return new HttpHeaders(this.authService.getAuthHeader());
  }

  // Lead Types
  getLeadTypes(): Observable<LeadType[]> {
    return this.http.get<LeadType[]>(`${this.apiUrl}/lead-types`, { headers: this.getHeaders() });
  }

  createLeadType(type: LeadType): Observable<LeadType> {
    return this.http.post<LeadType>(`${this.apiUrl}/lead-types`, type, { headers: this.getHeaders() });
  }

  updateLeadType(id: number, type: LeadType): Observable<LeadType> {
    return this.http.put<LeadType>(`${this.apiUrl}/lead-types/${id}`, type, { headers: this.getHeaders() });
  }

  deleteLeadType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lead-types/${id}`, { headers: this.getHeaders() });
  }

  // Customer Leads
  getLeads(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(`${this.apiUrl}/leads`, { headers: this.getHeaders(), params: httpParams });
  }

  getLeadById(id: number): Observable<CustomerLead> {
    return this.http.get<CustomerLead>(`${this.apiUrl}/leads/${id}`, { headers: this.getHeaders() });
  }

  createLead(lead: CustomerLead): Observable<CustomerLead> {
    return this.http.post<CustomerLead>(`${this.apiUrl}/leads`, lead, { headers: this.getHeaders() });
  }

  updateLead(id: number, lead: CustomerLead): Observable<CustomerLead> {
    return this.http.put<CustomerLead>(`${this.apiUrl}/leads/${id}`, lead, { headers: this.getHeaders() });
  }

  deleteLead(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/leads/${id}`, { headers: this.getHeaders() });
  }

  getReminders(date?: string): Observable<CustomerLead[]> {
    let httpParams = new HttpParams();
    if (date) httpParams = httpParams.set('date', date);
    return this.http.get<CustomerLead[]>(`${this.apiUrl}/leads/reminders`, { headers: this.getHeaders(), params: httpParams });
  }

  // Follow Ups
  getFollowUps(leadId: number): Observable<FollowUp[]> {
    return this.http.get<FollowUp[]>(`${this.apiUrl}/leads/${leadId}/followups`, { headers: this.getHeaders() });
  }

  addFollowUp(leadId: number, followup: FollowUp): Observable<FollowUp> {
    return this.http.post<FollowUp>(`${this.apiUrl}/leads/${leadId}/followups`, followup, { headers: this.getHeaders() });
  }

  // Notes
  getNotes(leadId: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUrl}/leads/${leadId}/notes`, { headers: this.getHeaders() });
  }

  addNote(leadId: number, note: Note): Observable<Note> {
    return this.http.post<Note>(`${this.apiUrl}/leads/${leadId}/notes`, note, { headers: this.getHeaders() });
  }

  deleteNote(leadId: number, noteId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/leads/${leadId}/notes/${noteId}`, { headers: this.getHeaders() });
  }

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`, { headers: this.getHeaders() });
  }

  // Import/Export
  exportExcel(params: any): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get(`${this.apiUrl}/leads/export/excel`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    });
  }

  exportPdf(params: any): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get(`${this.apiUrl}/leads/export/pdf`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    });
  }

  importCSV(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/leads/import`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.token()}`
      })
    });
  }
}
