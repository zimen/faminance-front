import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogConfig } from '../../services/dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="onCancel()">
      <div class="dialog-container" (click)="$event.stopPropagation()">
        <div class="dialog-header" [class]="'type-' + (config.type || 'info')">
          <span class="dialog-icon" *ngIf="config.icon || config.type">
            {{ config.icon || getDefaultIcon() }}
          </span>
          <h2 class="dialog-title">{{ config.title }}</h2>
        </div>
        
        <div class="dialog-body">
          <p class="dialog-message" [innerHTML]="config.message"></p>
        </div>
        
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="onCancel()">
            {{ config.cancelText || 'Annuler' }}
          </button>
          <button class="btn btn-primary" (click)="onConfirm()" [class]="'btn-' + (config.type || 'primary')">
            {{ config.confirmText || 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dialog-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .dialog-header.type-warning {
      background: #fffbf0;
      border-bottom-color: #ffc107;
    }

    .dialog-header.type-error {
      background: #fff5f5;
      border-bottom-color: #ef4444;
    }

    .dialog-header.type-success {
      background: #f0fdf4;
      border-bottom-color: #10b981;
    }

    .dialog-icon {
      font-size: 1.75rem;
      line-height: 1;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      flex: 1;
    }

    .dialog-body {
      padding: 1.5rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .dialog-message {
      margin: 0;
      color: #475569;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .dialog-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
    }

    .btn-warning:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .btn-error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .btn-error:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-success:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  `]
})
export class ConfirmDialogComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  
  config: DialogConfig = { message: '' };

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getDefaultIcon(): string {
    switch (this.config.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  }
}
