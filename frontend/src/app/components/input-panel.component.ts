import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input-panel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="mb-3">
      <label for="input" class="form-label">Input (stdin)</label>
      <textarea 
        id="input"
        class="form-control"
        [value]="input"
        (change)="onInputChange($event)"
        placeholder="Enter input here..."
        rows="4"
        style="font-family: monospace;"></textarea>
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
