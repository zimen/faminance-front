import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, ToastConfig } from '../../services/dialog.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" 
           class="toast" 
           [class]="'toast-' + (toast.type || 'info')"
           [@slideIn]>
        <span class="toast-icon" *ngIf="toast.icon">{{ toast.icon }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
      font-weight: 500;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }

    .toast-success {
      background: #d1fae5;
      color: #065f46;
      border-left: 4px solid #10b981;
    }

    .toast-error {
      background: #fee2e2;
      color: #991b1b;
      border-left: 4px solid #ef4444;
    }

    .toast-warning {
      background: #fef3c7;
      color: #92400e;
      border-left: 4px solid #f59e0b;
    }

    .toast-info {
      background: #dbeafe;
      color: #1e40af;
      border-left: 4px solid #3b82f6;
    }

    .toast-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    .toast-message {
      flex: 1;
    }

    @media (max-width: 640px) {
      .toast-container {
        left: 1rem;
        right: 1rem;
        max-width: none;
      }

      .toast {
        width: 100%;
      }
    }
  `]
})
export class ToastComponent implements OnInit {
  toasts: ToastConfig[] = [];

  constructor(private dialogService: DialogService) {}

  ngOnInit(): void {
    this.dialogService.getToasts().subscribe(toasts => {
      this.toasts = toasts;
    });
  }
}
