import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CRMService, CustomerLead } from '../services/crm';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-reminders',
  imports: [RouterLink],
  templateUrl: './reminders.html',
  styleUrl: './reminders.css'
})
export class RemindersComponent implements OnInit {
  private crmService = inject(CRMService);
  authService = inject(AuthService);

  reminders = signal<CustomerLead[]>([]);
  isLoading = signal<boolean>(false);

  // Filter option
  filterMode = signal<string>('all'); // all, today, overdue

  ngOnInit() {
    this.loadReminders();
  }

  loadReminders() {
    this.isLoading.set(true);
    this.crmService.getReminders().subscribe({
      next: (data) => {
        this.reminders.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getFilteredReminders(): CustomerLead[] {
    const mode = this.filterMode();
    const todayStr = new Date().toISOString().split('T')[0];

    return this.reminders().filter(lead => {
      if (!lead.nextFollowupDate) return false;
      const nextDate = lead.nextFollowupDate.substring(0, 10);
      
      if (mode === 'today') {
        return nextDate === todayStr;
      } else if (mode === 'overdue') {
        return nextDate < todayStr;
      }
      return true; // all
    });
  }

  setFilterMode(mode: string) {
    this.filterMode.set(mode);
  }

  isOverdue(dateStr: string | undefined): boolean {
    if (!dateStr) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr.substring(0, 10) < todayStr;
  }

  formatDate(dateStr: any): string {
    if (!dateStr) return '-';
    return dateStr.substring(0, 10);
  }

  openWhatsApp(lead: CustomerLead) {
    let phone = lead.mobile.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    const message = `Hello ${lead.customerName}, this is ${this.authService.getUserName()} from CRM following up on our discussion. Please let me know your availability. Thanks!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }
}
