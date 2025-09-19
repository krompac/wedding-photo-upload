import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';
import { wait } from '../utils/wait.util';

@Directive({ selector: '[appScrollTo]' })
export class ScrollToDirective implements AfterViewInit {
  private readonly elementRef = inject(ElementRef);

  async ngAfterViewInit(): Promise<void> {
    await wait(100);
    document.querySelector('app-wedding-photos-page')?.scrollTo({
      top: this.elementRef.nativeElement.offsetTop - 20,
      behavior: 'smooth',
    });
  }
}
