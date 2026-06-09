import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  template: `
    <div class="mb-3">
      <label for="language" class="form-label">Language</label>
      <select 
        id="language"
        class="form-select" 
        [value]="selectedLanguage"
        (change)="onLanguageChange($event)">
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
      </select>
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
