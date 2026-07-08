import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CRMService, DashboardStats } from '../services/crm';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private crmService = inject(CRMService);

  stats = signal<DashboardStats | null>(null);
  isLoading = signal<boolean>(true);

  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sectorChart') sectorChartRef!: ElementRef<HTMLCanvasElement>;

  statusChartInstance: Chart | null = null;
  sectorChartInstance: Chart | null = null;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.crmService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
        // Wait for DOM to render the canvas elements, then initialize charts
        setTimeout(() => this.initCharts(), 50);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  initCharts() {
    const data = this.stats();
    if (!data) return;

    // Destroy old charts if existing
    if (this.statusChartInstance) this.statusChartInstance.destroy();
    if (this.sectorChartInstance) this.sectorChartInstance.destroy();

    // 1. Status Doughnut Chart
    const statusKeys = Object.keys(data.leadsByStatus);
    const statusValues = Object.values(data.leadsByStatus);
    
    if (this.statusChartRef) {
      this.statusChartInstance = new Chart(this.statusChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: statusKeys,
          datasets: [{
            data: statusValues,
            backgroundColor: [
              '#6366f1', // New
              '#3b82f6', // Contacted
              '#10b981', // Interested
              '#f59e0b', // Follow Up
              '#8b5cf6', // Visit Scheduled
              '#ec4899', // Negotiation
              '#059669', // Closed Won
              '#dc2626', // Closed Lost
              '#64748b'  // Not Interested
            ],
            borderWidth: 2,
            borderColor: document.body.classList.contains('dark-theme') ? '#1e293b' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#475569',
                font: { family: 'Inter' }
              }
            }
          }
        }
      });
    }

    // 2. Sector Bar Chart
    const sectorKeys = Object.keys(data.leadsBySector);
    const sectorValues = Object.values(data.leadsBySector);

    if (this.sectorChartRef) {
      this.sectorChartInstance = new Chart(this.sectorChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: sectorKeys,
          datasets: [{
            label: 'Leads per Sector',
            data: sectorValues,
            backgroundColor: 'rgba(99, 102, 241, 0.75)',
            borderColor: '#6366f1',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#475569',
                font: { family: 'Inter' }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: document.body.classList.contains('dark-theme') ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
              },
              ticks: {
                color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#475569',
                stepSize: 1,
                font: { family: 'Inter' }
              }
            }
          }
        }
      });
    }
  }
}
