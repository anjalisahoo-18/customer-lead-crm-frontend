import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CRMService, LeadType } from '../services/crm';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lead-types',
  imports: [ReactiveFormsModule],
  templateUrl: './lead-types.html',
  styleUrl: './lead-types.css'
})
export class LeadTypesComponent implements OnInit {
  private crmService = inject(CRMService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  leadTypes = signal<LeadType[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Edit State
  selectedType = signal<LeadType | null>(null);
  showForm = signal<boolean>(false);

  typeForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['']
  });

  ngOnInit() {
    if (this.authService.currentRole() !== 'ADMIN') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadLeadTypes();
  }

  loadLeadTypes() {
    this.isLoading.set(true);
    this.crmService.getLeadTypes().subscribe({
      next: (data) => {
        this.leadTypes.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to load lead types.');
      }
    });
  }

  openCreateForm() {
    this.selectedType.set(null);
    this.typeForm.reset();
    this.showForm.set(true);
    this.errorMessage.set(null);
  }

  openEditForm(type: LeadType) {
    this.selectedType.set(type);
    this.typeForm.patchValue({
      name: type.name,
      description: type.description
    });
    this.showForm.set(true);
    this.errorMessage.set(null);
  }

  closeForm() {
    this.showForm.set(false);
    this.selectedType.set(null);
    this.typeForm.reset();
  }

  onSubmit() {
    if (this.typeForm.invalid) return;

    this.errorMessage.set(null);
    const formVal = this.typeForm.value;
    const typeId = this.selectedType()?.id;

    if (typeId) {
      // Update
      this.crmService.updateLeadType(typeId, formVal).subscribe({
        next: () => {
          this.loadLeadTypes();
          this.closeForm();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to update lead type.');
        }
      });
    } else {
      // Create
      this.crmService.createLeadType(formVal).subscribe({
        next: () => {
          this.loadLeadTypes();
          this.closeForm();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to create lead type.');
        }
      });
    }
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this lead type? Leads assigned to it may fail to load.')) {
      this.crmService.deleteLeadType(id).subscribe({
        next: () => {
          this.loadLeadTypes();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete lead type.');
        }
      });
    }
  }
}
