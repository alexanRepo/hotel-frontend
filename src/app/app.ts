import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Confirm } from './shared/components/confirm';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Confirm],
  template: '<router-outlet/><app-confirm/>',
})
export class App {}
