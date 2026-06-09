import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input-panel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="d-flex flex-column h-100">
      <label for="input" class="form-label fw-semibold text-secondary small d-flex align-items-center gap-1 mb-2">
        <i class="bi bi-keyboard-fill"></i> Provide Execution Parameters (stdin)
      </label>
      <textarea
        id="input"
        class="form-control flex-grow-1 font-monospace p-3 border rounded shadow-inner"
        [value]="input"
        (input)="onInputChange($event)"
        placeholder="Type test inputs here, then click Run..."
        style="font-size: 13px; min-height: 420px; resize: none;"></textarea>
    </div>
  `
})
export class InputPanelComponent {
  @Input() input: string = '';
  @Output() inputChanged = new EventEmitter<string>();

  onInputChange(event: any) {
    this.input = event.target.value;
    this.inputChanged.emit(this.input);
  }
}
