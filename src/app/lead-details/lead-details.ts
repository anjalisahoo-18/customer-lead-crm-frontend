import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CRMService, CustomerLead, FollowUp, Note } from '../services/crm';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-lead-details',
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './lead-details.html',
  styleUrl: './lead-details.css'
})
export class LeadDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private crmService = inject(CRMService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  leadId = signal<number>(0);
  lead = signal<CustomerLead | null>(null);
  followups = signal<FollowUp[]>([]);
  notes = signal<Note[]>([]);

  isLoading = signal<boolean>(false);
  showFollowUpForm = signal<boolean>(false);

  // Form Option mappings
  statuses = ['New', 'Contacted', 'Interested', 'Follow Up', 'Visit Scheduled', 'Negotiation', 'Closed Won', 'Closed Lost', 'Not Interested'];
  priorities = ['Hot', 'Warm', 'Cold', 'Not a Customer'];

  followUpForm: FormGroup = this.fb.group({
    discussionDetails: ['', [Validators.required, Validators.minLength(5)]],
    nextFollowupDate: ['', [Validators.required]],
    status: ['', [Validators.required]],
    priority: ['', [Validators.required]],
    executive: ['', [Validators.required]]
  });

  newNoteText = '';

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = +idParam;
      this.leadId.set(id);
      this.loadAllData();
    }
  }

  loadAllData() {
    this.isLoading.set(true);
    const id = this.leadId();

    this.crmService.getLeadById(id).subscribe({
      next: (leadData) => {
        this.lead.set(leadData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.crmService.getFollowUps(id).subscribe(data => this.followups.set(data));
    this.crmService.getNotes(id).subscribe(data => this.notes.set(data));
  }

  openFollowUpForm() {
    const currentLead = this.lead();
    if (!currentLead) return;

    this.followUpForm.reset({
      status: currentLead.status,
      priority: currentLead.priority,
      executive: this.authService.getUserName()
    });
    this.showFollowUpForm.set(true);
  }

  closeFollowUpForm() {
    this.showFollowUpForm.set(false);
    this.followUpForm.reset();
  }

  onSubmitFollowUp() {
    if (this.followUpForm.invalid) return;

    this.crmService.addFollowUp(this.leadId(), this.followUpForm.value).subscribe({
      next: () => {
        this.loadAllData();
        this.closeFollowUpForm();
      },
      error: (err) => alert(err.error?.message || 'Failed to record follow-up')
    });
  }

  onAddNote() {
    if (!this.newNoteText.trim()) return;

    const notePayload: Note = {
      noteText: this.newNoteText,
      createdBy: this.authService.getUserName()
    };

    this.crmService.addNote(this.leadId(), notePayload).subscribe({
      next: () => {
        this.newNoteText = '';
        this.crmService.getNotes(this.leadId()).subscribe(data => this.notes.set(data));
      },
      error: (err) => alert(err.error?.message || 'Failed to add note')
    });
  }

  onDeleteNote(noteId: number) {
    if (confirm('Are you sure you want to delete this note?')) {
      this.crmService.deleteNote(this.leadId(), noteId).subscribe({
        next: () => {
          this.crmService.getNotes(this.leadId()).subscribe(data => this.notes.set(data));
        },
        error: (err) => alert(err.error?.message || 'Failed to delete note')
      });
    }
  }

  formatDate(dateStr: any): string {
    if (!dateStr) return '-';
    return dateStr.substring(0, 10);
  }

  formatDateTime(dateTimeStr: any): string {
    if (!dateTimeStr) return '-';
    // formats like YYYY-MM-DD HH:MM
    return dateTimeStr.substring(0, 10) + ' ' + dateTimeStr.substring(11, 16);
  }
}
