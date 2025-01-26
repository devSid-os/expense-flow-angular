import { Component, ViewEncapsulation } from '@angular/core';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-loader',
  imports: [ProgressSpinner],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LoaderComponent {

}
