import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, Signal, ViewEncapsulation } from '@angular/core';
import { UserAccountService } from '../../Services/account.service';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { AvatarModule } from 'primeng/avatar';
import { UserModel } from '../../Models/user.model';

@Component({
  selector: 'app-profile-avatar',
  imports: [CommonModule, OverlayBadgeModule, AvatarModule],
  templateUrl: './profile-avatar.component.html',
  styleUrl: './profile-avatar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ProfileAvatarComponent {

  private _userAccountServ: UserAccountService = inject(UserAccountService);
  userData: Signal<UserModel> = computed(() => this._userAccountServ.userPayload());
  @Input('avatarSize') avatarSize: 'normal' | 'large' | 'xlarge' = 'normal';
}