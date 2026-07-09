import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CRMService, CustomerLead, LeadType } from '../services/crm';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-leads',
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './leads.html',
  styleUrl: './leads.css'
})
export class LeadsComponent implements OnInit {
  private crmService = inject(CRMService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  leads = signal<CustomerLead[]>([]);
  leadTypes = signal<LeadType[]>([]);
  
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  selectedLead = signal<CustomerLead | null>(null);

  // Pagination
  page = signal<number>(0);
  size = 10;
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);

  // Filter values
  filterLeadTypeId = '';
  filterStatus = '';
  filterPriority = '';
  filterCity = '';
  filterStartDate = '';
  filterEndDate = '';
  filterName = '';
  filterMobile = '';
  globalSearch = '';

  // Options
  statuses = ['New', 'Contacted', 'Interested', 'Follow Up', 'Visit Scheduled', 'Negotiation', 'Closed Won', 'Closed Lost', 'Not Interested'];
  priorities = ['Hot', 'Warm', 'Cold', 'Not a Customer'];
  sources = ['Web', 'Referral', 'Campaign', 'Social Media', 'Walk-in', 'Cold Call', 'Other'];

  leadForm: FormGroup = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9+ ]{10,15}$')]],
    alternateNumber: [''],
    email: ['', [Validators.email]],
    leadTypeId: ['', [Validators.required]],
    city: [''],
    address: [''],
    requirement: [''],
    leadSource: ['Web'],
    assignedExecutive: [''],
    discussionDetails: [''],
    visitDate: [''],
    nextFollowupDate: [''],
    status: ['New'],
    priority: ['Warm']
  });

  // Import Results State
  importResult = signal<any | null>(null);

  ngOnInit() {
    this.loadLeadTypes();
    this.loadLeads();

    // Check query params if redirected to open create form
    this.route.queryParams.subscribe(params => {
      if (params['showCreate'] === 'true') {
        this.openCreateForm();
      }
    });
  }

  loadLeadTypes() {
    this.crmService.getLeadTypes().subscribe(data => this.leadTypes.set(data));
  }

  loadLeads() {
    this.isLoading.set(true);
    const params = {
      leadTypeId: this.filterLeadTypeId || null,
      status: this.filterStatus || null,
      priority: this.filterPriority || null,
      city: this.filterCity || null,
      startDate: this.filterStartDate || null,
      endDate: this.filterEndDate || null,
      customerName: this.filterName || null,
      mobile: this.filterMobile || null,
      search: this.globalSearch || null,
      assignedExecutive: this.authService.currentRole() === 'EXECUTIVE' ? this.authService.getUserName() : null,
      page: this.page(),
      size: this.size,
      sort: 'createdDate,desc'
    };

    this.crmService.getLeads(params).subscribe({
      next: (res) => {
        this.leads.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFilter() {
    this.page.set(0);
    this.loadLeads();
  }

  clearFilters() {
    this.filterLeadTypeId = '';
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterCity = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterName = '';
    this.filterMobile = '';
    this.globalSearch = '';
    this.page.set(0);
    this.loadLeads();
  }

  changePage(p: number) {
    if (p >= 0 && p < this.totalPages()) {
      this.page.set(p);
      this.loadLeads();
    }
  }

  openCreateForm() {
    this.selectedLead.set(null);
    this.leadForm.reset({
      leadSource: 'Web',
      status: 'New',
      priority: 'Warm',
      assignedExecutive: this.authService.getUserName()
    });
    this.showForm.set(true);
  }

  openEditForm(lead: CustomerLead) {
    this.selectedLead.set(lead);
    this.leadForm.patchValue({
      customerName: lead.customerName,
      mobile: lead.mobile,
      alternateNumber: lead.alternateNumber,
      email: lead.email,
      leadTypeId: lead.leadType.id,
      city: lead.city,
      address: lead.address,
      requirement: lead.requirement,
      leadSource: lead.leadSource,
      assignedExecutive: lead.assignedExecutive,
      discussionDetails: lead.discussionDetails,
      visitDate: lead.visitDate,
      nextFollowupDate: lead.nextFollowupDate,
      status: lead.status,
      priority: lead.priority
    });
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.selectedLead.set(null);
    this.leadForm.reset();
  }

  onSubmit() {
    if (this.leadForm.invalid) return;

    const val = this.leadForm.value;
    // Map leadTypeId to leadType object
    val.leadType = { id: val.leadTypeId };
    delete val.leadTypeId;

    const leadId = this.selectedLead()?.id;

    if (leadId) {
      this.crmService.updateLead(leadId, val).subscribe({
        next: () => {
          this.loadLeads();
          this.closeForm();
        },
        error: (err) => alert(err.error?.message || 'Failed to update lead')
      });
    } else {
      this.crmService.createLead(val).subscribe({
        next: () => {
          this.loadLeads();
          this.closeForm();
        },
        error: (err) => alert(err.error?.message || 'Failed to create lead')
      });
    }
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this customer lead?')) {
      this.crmService.deleteLead(id).subscribe({
        next: () => this.loadLeads(),
        error: (err) => alert(err.error?.message || 'Failed to delete lead')
      });
    }
  }

  // Export
  exportToExcel() {
    const params = {
      leadTypeId: this.filterLeadTypeId || null,
      status: this.filterStatus || null,
      priority: this.filterPriority || null,
      city: this.filterCity || null,
      startDate: this.filterStartDate || null,
      endDate: this.filterEndDate || null,
      customerName: this.filterName || null,
      mobile: this.filterMobile || null,
      search: this.globalSearch || null,
      assignedExecutive: this.authService.currentRole() === 'EXECUTIVE' ? this.authService.getUserName() : null
    };

    this.crmService.exportExcel(params).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  exportToPdf() {
    const params = {
      leadTypeId: this.filterLeadTypeId || null,
      status: this.filterStatus || null,
      priority: this.filterPriority || null,
      city: this.filterCity || null,
      startDate: this.filterStartDate || null,
      endDate: this.filterEndDate || null,
      customerName: this.filterName || null,
      mobile: this.filterMobile || null,
      search: this.globalSearch || null,
      assignedExecutive: this.authService.currentRole() === 'EXECUTIVE' ? this.authService.getUserName() : null
    };

    this.crmService.exportPdf(params).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  // Import CSV file
  onImportClick(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.crmService.importCSV(file).subscribe({
        next: (res) => {
          this.importResult.set(res);
          this.loadLeads();
        },
        error: (err) => alert(err.error?.message || 'CSV Import failed')
      });
    }
  }

  // WhatsApp Button Action
  openWhatsApp(lead: CustomerLead) {
    let phone = lead.mobile.replace(/\D/g, ''); // strip non-digits
    
    // Add default Indian country code '91' if it has 10 digits
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    
    const message = `Hello ${lead.customerName}, this is ${this.authService.getUserName()} from CRM. I wanted to follow up regarding your enquiry for ${lead.leadType.name || 'our service'}. Let me know a convenient time to speak. Thank you!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  formatDate(dateStr: any): string {
    if (!dateStr) return '-';
    // simple YYYY-MM-DD formatting
    return dateStr.substring(0, 10);
  }
}
