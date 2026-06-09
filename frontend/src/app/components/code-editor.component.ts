import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import monacoLoader from '@monaco-editor/loader';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  template: `
    <div class="mb-2">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="text-secondary small fw-semibold d-flex align-items-center gap-1">
          <i class="bi bi-code-slash"></i> Workspace Source Code
        </span>
      </div>
      <div #editorContainer class="border rounded shadow-inner overflow-hidden" style="height: 420px; width: 100%;"></div>
    </div>
  `
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {
  @Input() language: string = 'cpp';
  @Input() code: string = '';
  @Input() theme: 'light' | 'dark' = 'dark'; // 🌟 Accepts global application mode state values
  @Output() codeChanged = new EventEmitter<string>();

  @ViewChild('editorContainer') editorContainer?: ElementRef;
  private editor: any;
  private monacoInstance: any;

  ngAfterViewInit() {
    if (!this.editorContainer) return;

    monacoLoader.init().then((monaco) => {
      this.monacoInstance = monaco;

      this.editor = monaco.editor.create(this.editorContainer!.nativeElement, {
        value: this.code || this.getDefaultCode(),
        language: this.getMonacoLanguage(this.language),
        theme: this.theme === 'dark' ? 'vs-dark' : 'vs', // 🌟 Sets Monaco matching template canvas look
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        tabSize: 4,
        wordWrap: 'on',
        padding: { top: 8, bottom: 8 }
      });

      this.editor.onDidChangeModelContent(() => {
        const content = this.editor.getValue();
        this.codeChanged.emit(content);
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Dynamically adjust Monaco Theme canvas view layout rules during runtime switches
    if (this.editor && this.monacoInstance && changes['theme']) {
      const monacoThemeName = changes['theme'].currentValue === 'dark' ? 'vs-dark' : 'vs';
      this.monacoInstance.editor.setTheme(monacoThemeName);
    }

    if (this.editor && this.monacoInstance && changes['language']) {
      const model = this.editor.getModel();
      const newLanguage = this.getMonacoLanguage(this.language);
      this.monacoInstance.editor.setModelLanguage(model, newLanguage);

      if (!this.editor.getValue() || this.editor.getValue() === this.getDefaultCodeForLang(changes['language'].previousValue)) {
        this.editor.setValue(this.getDefaultCode());
        this.codeChanged.emit(this.getDefaultCode());
      }
    }

    if (this.editor && changes['code'] && !changes['code'].isFirstChange()) {
      const currentExternalValue = changes['code'].currentValue;
      if (this.editor.getValue() !== currentExternalValue) {
        this.editor.setValue(currentExternalValue || this.getDefaultCode());
      }
    }
  }

  getCode(): string {
    return this.editor ? this.editor.getValue() : '';
  }

  private getMonacoLanguage(language: string): string {
    const languageMap: { [key: string]: string } = { cpp: 'cpp', python: 'python', java: 'java' };
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
