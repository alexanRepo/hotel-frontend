import { Component, inject, Injectable, signal } from '@angular/core';
import { Modal } from './modal';
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  message = signal('');
  private done: ((value: boolean) => void) | null = null;
  ask(message: string) {
    this.done?.(false);
    this.message.set(message);
    return new Promise<boolean>((resolve) => (this.done = resolve));
  }
  resolve(value: boolean) {
    this.message.set('');
    this.done?.(value);
    this.done = null;
  }
}
@Component({
  selector: 'app-confirm',
  imports: [Modal],
  template: `<app-modal
    [open]="!!confirm.message()"
    title="Confirmar operación"
    (dismiss)="confirm.resolve(false)"
    ><p class="leading-relaxed">{{ confirm.message() }}</p>
    <div class="mt-6 flex justify-end gap-3">
      <button class="btn-secondary" (click)="confirm.resolve(false)">Volver</button
      ><button class="btn" (click)="confirm.resolve(true)">Confirmar</button>
    </div></app-modal
  >`,
})
export class Confirm {
  confirm = inject(ConfirmService);
}
