import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptConfig } from '../../services/dialog.service';

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-overlay" (click)="onCancel()">
      <div class="dialog-container" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <span class="dialog-icon" *ngIf="config.icon">{{ config.icon }}</span>
          <h2 class="dialog-title">{{ config.title }}</h2>
        </div>
        
        <div class="dialog-body">
          <p class="dialog-message" *ngIf="config.message" [innerHTML]="config.message"></p>
          <input
            #inputField
            [(ngModel)]="value"
            [type]="config.inputType || 'text'"
            [placeholder]="config.placeholder || ''"
            class="dialog-input"
            (keyup.enter)="onConfirm()"
            (keyup.escape)="onCancel()"
            autofocus
          />
        </div>
        
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="onCancel()">
            {{ config.cancelText || 'Annuler' }}
          </button>
          <button class="btn btn-primary" (click)="onConfirm()">
            {{ config.confirmText || 'OK' }}
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
    }

    .dialog-message {
      margin: 0 0 1rem 0;
      color: #475569;
      line-height: 1.6;
    }

    .dialog-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .dialog-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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
  `]
})
export class PromptDialogComponent {
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();
  
  config: PromptConfig = { message: '' };
  value = '';

  ngOnInit(): void {
    this.value = this.config.defaultValue || '';
  }

  onConfirm(): void {
    this.confirmed.emit(this.value);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
