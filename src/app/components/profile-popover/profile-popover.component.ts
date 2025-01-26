import { Component, computed, EventEmitter, inject, Input, Output, Signal } from '@angular/core';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar.component';
import { CommonModule } from '@angular/common';
import { UserAccountService } from '../../Services/account.service';
import { DividerModule } from 'primeng/divider';
import { UserModel } from '../../Models/user.model';

@Component({
  selector: 'app-profile-popover',
  imports: [ProfileAvatarComponent, DividerModule, CommonModule],
  templateUrl: './profile-popover.component.html',
  styleUrl: './profile-popover.component.scss'
})
export class ProfilePopoverComponent {
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  userData: Signal<UserModel> = computed(() => this._userAccountServ.userPayload());
  @Output('onSignout') signOut: EventEmitter<boolean> = new EventEmitter<boolean>();
}
