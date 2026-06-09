import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  template: `
    <select
      class="form-select border-0 font-monospace fw-bold shadow-none text-center py-0 custom-select"
      style="height: 32px; font-size: 14px; border-radius: 6px; width: 115px; cursor: pointer;"
      [value]="selectedLanguage"
      (change)="onLanguageChange($event)">
      <option value="cpp">C++</option>
      <option value="python">Python 3</option>
      <option value="java">Java</option>
    </select>
  `,
  styles: [`
    .custom-select {
      background-color: var(--bs-secondary-bg);
      color: #3498db !important;
    }
  `]
})
export class LanguageSelectorComponent {
  @Input() selectedLanguage: string = 'cpp';
  @Output() languageChanged = new EventEmitter<string>();

  onLanguageChange(event: any) {
    this.languageChanged.emit(event.target.value);
  }
}
