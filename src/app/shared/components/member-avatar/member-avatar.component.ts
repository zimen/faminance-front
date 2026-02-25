import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * MemberAvatarComponent - Avatar d'un membre de la famille
 * Affiche un avatar coloré avec les initiales du membre
 */
@Component({
  selector: 'app-member-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="member-avatar" 
      [style.background-color]="color"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.font-size.px]="size * 0.4"
      [title]="name"
    >
      <img *ngIf="avatarUrl" [src]="avatarUrl" [alt]="name" class="avatar-img" />
      <span *ngIf="!avatarUrl">{{ initials }}</span>
    </div>
  `,
  styles: [`
    .member-avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      top: 0;
      left: 0;
    }
  `]
})
export class MemberAvatarComponent {
  @Input() name: string = '';
  @Input() avatarUrl?: string;
  @Input() color: string = '#667eea';
  @Input() size: number = 40;

  get initials(): string {
    if (!this.name) return '?';
    
    const parts = this.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return this.name.substring(0, 2).toUpperCase();
  }
}
