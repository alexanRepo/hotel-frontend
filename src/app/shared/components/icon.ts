import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
@Component({
  selector: 'app-icon',
  imports: [LucideDynamicIcon],
  template: `<svg
    [lucideIcon]="name()"
    [size]="size()"
    [strokeWidth]="1.7"
    aria-hidden="true"
  ></svg>`,
})
export class Icon {
  name = input.required<string>();
  size = input(19);
}
