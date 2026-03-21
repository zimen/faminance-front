import { Injectable, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../components/alert-dialog/alert-dialog.component';
import { PromptDialogComponent } from '../components/prompt-dialog/prompt-dialog.component';
import { ToastComponent } from '../components/toast/toast.component';

export interface DialogConfig {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  icon?: string;
}

export interface PromptConfig extends DialogConfig {
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'password' | 'email' | 'number';
}

export interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  icon?: string;
}

/**
 * DialogService - Service pour afficher des dialogues personnalisés
 * Remplace les alert(), confirm(), prompt() natifs
 */
@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private toasts$ = new BehaviorSubject<ToastConfig[]>([]);
  
  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  /**
   * Affiche une boîte de confirmation
   * @returns Promise<boolean> - true si confirmé, false si annulé
   */
  async confirm(config: string | DialogConfig): Promise<boolean> {
    const dialogConfig: DialogConfig = typeof config === 'string' 
      ? { message: config, title: 'Confirmation' }
      : { title: 'Confirmation', confirmText: 'Confirmer', cancelText: 'Annuler', ...config };

    return new Promise((resolve) => {
      const componentRef = createComponent(ConfirmDialogComponent, {
        environmentInjector: this.injector
      });

      componentRef.instance.config = dialogConfig;
      componentRef.instance.confirmed.subscribe(() => {
        this.removeComponent(componentRef);
        resolve(true);
      });
      componentRef.instance.cancelled.subscribe(() => {
        this.removeComponent(componentRef);
        resolve(false);
      });

      this.attachComponent(componentRef);
    });
  }

  /**
   * Affiche une alerte
   */
  async alert(config: string | DialogConfig): Promise<void> {
    const dialogConfig: DialogConfig = typeof config === 'string'
      ? { message: config, title: 'Information' }
      : { title: 'Information', confirmText: 'OK', ...config };

    return new Promise((resolve) => {
      const componentRef = createComponent(AlertDialogComponent, {
        environmentInjector: this.injector
      });

      componentRef.instance.config = dialogConfig;
      componentRef.instance.closed.subscribe(() => {
        this.removeComponent(componentRef);
        resolve();
      });

      this.attachComponent(componentRef);
    });
  }

  /**
   * Affiche une boîte de saisie
   * @returns Promise<string | null> - la valeur saisie ou null si annulé
   */
  async prompt(config: string | PromptConfig): Promise<string | null> {
    const promptConfig: PromptConfig = typeof config === 'string'
      ? { message: config, title: 'Saisie', placeholder: '' }
      : { title: 'Saisie', confirmText: 'OK', cancelText: 'Annuler', placeholder: '', ...config };

    return new Promise((resolve) => {
      const componentRef = createComponent(PromptDialogComponent, {
        environmentInjector: this.injector
      });

      componentRef.instance.config = promptConfig;
      componentRef.instance.confirmed.subscribe((value: string) => {
        this.removeComponent(componentRef);
        resolve(value);
      });
      componentRef.instance.cancelled.subscribe(() => {
        this.removeComponent(componentRef);
        resolve(null);
      });

      this.attachComponent(componentRef);
    });
  }

  /**
   * Affiche un toast (notification temporaire)
   */
  toast(config: string | ToastConfig): void {
    const toastConfig: ToastConfig = typeof config === 'string'
      ? { message: config, type: 'info', duration: 3000 }
      : { type: 'info', duration: 3000, ...config };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, toastConfig]);

    setTimeout(() => {
      const updatedToasts = this.toasts$.value.filter(t => t !== toastConfig);
      this.toasts$.next(updatedToasts);
    }, toastConfig.duration);
  }

  /**
   * Raccourcis pour les toasts
   */
  success(message: string, duration = 3000): void {
    this.toast({ message, type: 'success', duration, icon: '✓' });
  }

  error(message: string, duration = 4000): void {
    this.toast({ message, type: 'error', duration, icon: '✕' });
  }

  warning(message: string, duration = 3500): void {
    this.toast({ message, type: 'warning', duration, icon: '⚠' });
  }

  info(message: string, duration = 3000): void {
    this.toast({ message, type: 'info', duration, icon: 'ℹ' });
  }

  getToasts() {
    return this.toasts$.asObservable();
  }

  private attachComponent(componentRef: any): void {
    this.appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);
  }

  private removeComponent(componentRef: any): void {
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }
}
