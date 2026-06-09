import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import monacoLoader from '@monaco-editor/loader';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  template: `
    <div class="mb-3">
      <label class="form-label">Code Editor</label>
      <div #editorContainer class="border rounded" style="height: 400px; width: 100%;"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CodeEditorComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() language: string = 'cpp';
  @Input() code: string = '';
  @Output() codeChanged = new EventEmitter<string>();

  @ViewChild('editorContainer') editorContainer?: ElementRef;
  private editor: any;
  private monacoInstance: any; // Saves the reference safely

  ngOnInit() {
    // Handled in initialization cycles
  }

  ngAfterViewInit() {
    if (!this.editorContainer) return;

    // Safely load monaco without breaking the dev server bundle engine
    monacoLoader.init().then((monaco) => {
      this.monacoInstance = monaco;

      this.editor = monaco.editor.create(this.editorContainer!.nativeElement, {
        value: this.code || this.getDefaultCode(),
        language: this.getMonacoLanguage(this.language),
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        tabSize: 2,
        wordWrap: 'on'
      });

      this.editor.onDidChangeModelContent(() => {
        const content = this.editor.getValue();
        this.codeChanged.emit(content);
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Make sure monaco and the editor are loaded before switching languages
    if (this.editor && this.monacoInstance && changes['language']) {
      const model = this.editor.getModel();
      const newLanguage = this.getMonacoLanguage(this.language);
      this.monacoInstance.editor.setModelLanguage(model, newLanguage);

      // If code property wasn't touched by user, load standard default template
      if (!this.editor.getValue() || this.editor.getValue() === this.getDefaultCodeForLang(changes['language'].previousValue)) {
        this.editor.setValue(this.getDefaultCode());
      }
    }
  }

  getCode(): string {
    return this.editor ? this.editor.getValue() : '';
  }

  private getMonacoLanguage(language: string): string {
    const languageMap: { [key: string]: string } = {
      cpp: 'cpp',
      python: 'python',
      java: 'java'
    };
    return languageMap[language] || 'plaintext';
  }

  private getDefaultCodeForLang(lang: string): string {
    const templates: { [key: string]: string } = {
      cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
      python: `print("Hello, World!")`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    };
    return templates[lang] || '';
  }

  private getDefaultCode(): string {
    return this.getDefaultCodeForLang(this.language);
  }
}
