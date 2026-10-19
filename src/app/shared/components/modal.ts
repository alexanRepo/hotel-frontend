import { Component, input, output, viewChild, ElementRef, effect } from '@angular/core';
let nextModal = 0;
@Component({
  selector: 'app-modal',
  template: `<dialog
    #dialog
    class="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/45"
    [attr.aria-labelledby]="titleId"
    (cancel)="cancel($event)"
  >
    <div class="flex items-center justify-between border-b border-slate-100 px-6 py-5">
      <h2 [id]="titleId">{{ title() }}</h2>
      <button
        type="button"
        class="btn-secondary !px-3 !py-1.5"
        aria-label="Cerrar ventana"
        [disabled]="busy()"
        (click)="dismiss.emit()"
      >
        ✕
      </button>
    </div>
    <div class="p-6"><ng-content /></div>
  </dialog>`,
})
export class Modal {
  titleId = 'hotel-modal-' + ++nextModal;
  open = input(false);
  title = input('');
  busy = input(false);
  dismiss = output<void>();
  private element = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  constructor() {
    effect(() => {
      const el = this.element()?.nativeElement;
      if (!el) return;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }
  cancel(e: Event) {
    e.preventDefault();
    if (!this.busy()) this.dismiss.emit();
  }
}
