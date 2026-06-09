import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  template: `
    <div class="form-floating mb-2">
      <select
        id="language"
        class="form-select fw-semibold"
        [value]="selectedLanguage"
        (change)="onLanguageChange($event)">
        <option value="cpp">C++ (GCC 13)</option>
        <option value="python">Python (3.11)</option>
        <option value="java">Java (OpenJDK)</option>
      </select>
      <label for="language" class="fw-bold text-primary"><i class="bi bi-cpu me-1"></i>Compiler Engine</label>
    </div>
  `
})
export class LanguageSelectorComponent {
  @Input() selectedLanguage: string = 'cpp';
  @Output() languageChanged = new EventEmitter<string>();

  onLanguageChange(event: any) {
    const language = event.target.value;
    this.selectedLanguage = language;
    this.languageChanged.emit(language);
  }
}
