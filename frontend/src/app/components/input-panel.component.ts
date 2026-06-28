import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input-panel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="d-flex flex-column h-100">
      <div class="text-secondary small font-monospace mb-2 fs-6 d-none d-md-block">
        <i class="bi bi-keyboard"></i> Input (stdin):
      </div>
      <textarea
        class="form-control flex-grow-1 font-monospace p-2 p-sm-3 custom-textarea"
        [value]="input"
        (input)="onInputChange($event)"
        placeholder="Type test strings here..."
        style="resize: none;"></textarea>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .custom-textarea {
      background-color: var(--bs-body-bg) !important;
      color: var(--bs-body-color) !important;
      border: 1px solid var(--bs-border-color);
      border-radius: 6px;
      font-size: 14px !important;
    }

    @media (min-width: 768px) {
      .custom-textarea {
        font-size: 15px !important;
      }
    }
  `]
})
export class InputPanelComponent {
  @Input() input: string = '';
  @Output() inputChanged = new EventEmitter<string>();

  onInputChange(event: any) {
    this.inputChanged.emit(event.target.value);
  }
}
