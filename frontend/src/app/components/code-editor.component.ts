import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import monacoLoader from '@monaco-editor/loader';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  template: `
    <div #editorContainer class="w-100 h-100 m-0 p-0 position-absolute top-0 start-0"></div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; position: relative; }
  `]
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {
  @Input() language: string = 'cpp';
  @Input() code: string = '';
  @Input() theme: 'light' | 'dark' = 'dark';
  @Output() codeChanged = new EventEmitter<string>();

  @ViewChild('editorContainer') editorContainer?: ElementRef;
  private editor: any;
  private monacoInstance: any;

  // 🌟 Recalculates editor layout parameters instantly if mobile orientation changes
  @HostListener('window:resize')
  onWindowResize() {
    if (this.editor) {
      const isMobile = window.innerWidth < 768;
      this.editor.updateOptions({
        fontSize: isMobile ? 14 : 16,
        lineHeight: isMobile ? 20 : 24
      });
      this.editor.layout();
    }
  }

  ngAfterViewInit() {
    if (!this.editorContainer) return;

    monacoLoader.init().then((monaco) => {
      this.monacoInstance = monaco;

      const isMobile = window.innerWidth < 768;

      this.editor = monaco.editor.create(this.editorContainer!.nativeElement, {
        value: this.code || this.getDefaultCode(),
        language: this.getMonacoLanguage(this.language),
        theme: this.theme === 'dark' ? 'vs-dark' : 'vs',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: isMobile ? 14 : 16,
        fontFamily: "'Fira Code', Consolas, Monaco, monospace",
        tabSize: 4,
        wordWrap: 'on',
        lineHeight: isMobile ? 20 : 24,
        padding: { top: 12, bottom: 12 },
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: isMobile ? 8 : 10,
          horizontalScrollbarSize: isMobile ? 8 : 10
        }
      });

      this.editor.onDidChangeModelContent(() => {
        this.codeChanged.emit(this.editor.getValue());
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.editor && this.monacoInstance && changes['theme']) {
      this.monacoInstance.editor.setTheme(changes['theme'].currentValue === 'dark' ? 'vs-dark' : 'vs');
    }

    if (this.editor && this.monacoInstance && changes['language']) {
      const model = this.editor.getModel();
      this.monacoInstance.editor.setModelLanguage(model, this.getMonacoLanguage(this.language));

      if (!this.editor.getValue() || this.editor.getValue() === this.getDefaultCodeForLang(changes['language'].previousValue)) {
        this.editor.setValue(this.getDefaultCode());
        this.codeChanged.emit(this.getDefaultCode());
      }
    }

    if (this.editor && changes['code'] && !changes['code'].isFirstChange()) {
      if (this.editor.getValue() !== changes['code'].currentValue) {
        this.editor.setValue(changes['code'].currentValue || this.getDefaultCode());
      }
    }
  }

  private getMonacoLanguage(language: string): string {
    const languageMap: { [key: string]: string } = { cpp: 'cpp', python: 'python', java: 'java' };
    return languageMap[language] || 'plaintext';
  }

  private getDefaultCodeForLang(lang: string): string {
    const templates: { [key: string]: string } = {
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      python: `print("Hello, World!")`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    };
    return templates[lang] || '';
  }

  private getDefaultCode(): string {
    return this.getDefaultCodeForLang(this.language);
  }
}
