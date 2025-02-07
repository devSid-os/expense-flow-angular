import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Lightbox, LightboxConfig, LightboxModule } from 'ngx-lightbox';

@Component({
  selector: 'app-form-image-preview',
  imports: [LightboxModule],
  templateUrl: './form-image-preview.component.html',
  styleUrl: './form-image-preview.component.scss'
})
export class FormImagePreviewComponent {
  private _lightbox: Lightbox = inject(Lightbox);
  private _lightboxConfig: LightboxConfig = inject(LightboxConfig);
  @Input('fileUrl') fileUrl!: string | null;
  @Output('removeFileUrl') removeFileUrl: EventEmitter<true> = new EventEmitter<true>();

  constructor() {
    this._lightboxConfig.resizeDuration = 1;
    this._lightboxConfig.fadeDuration = 0;
    this._lightboxConfig.enableTransition = false;
    this._lightboxConfig.showDownloadButton = true;
    this._lightboxConfig.disableScrolling = true;
    this._lightboxConfig.centerVertically = true;
    this._lightboxConfig.wrapAround = true;
  }

  openUploadedFilePreview(mediaUrl: string): void {
    this._lightbox.open([{ src: mediaUrl, caption: '', thumb: '' }], 0);
  }
}
