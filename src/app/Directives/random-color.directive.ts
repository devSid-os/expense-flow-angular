import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appRandomColor]'
})
export class RandomColorDirective {

  @Input() appRandomColor: string = ''; // Input to generate deterministic colors

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.el.nativeElement.style.backgroundColor = this.getRandomColor(this.appRandomColor);
  }

  private getRandomColor(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    return '#' + ((hash & 0x00ffffff).toString(16).toUpperCase()).padStart(6, '0');
  }

}
