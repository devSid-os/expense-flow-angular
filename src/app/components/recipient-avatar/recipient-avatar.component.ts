import { CommonModule } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-recipient-avatar',
  imports: [AvatarModule, CommonModule],
  templateUrl: './recipient-avatar.component.html',
  styleUrl: './recipient-avatar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class RecipientAvatarComponent {
  @Input('name') name!: string;
  @Input('size') size!: 'normal' | 'large' | 'xlarge';
  @Input('profileUrl') profileUrl!: string | null;
}
