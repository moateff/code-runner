import { ChangeDetectorRef, Component, OnInit, ViewChild, Renderer2, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { LanguageSelectorComponent } from './components/language-selector.component';
import { CodeEditorComponent } from './components/code-editor.component';
import { InputPanelComponent } from './components/input-panel.component';
import { OutputPanelComponent } from './components/output-panel.component';
import { CompilerService } from './services/compiler.service';
import { RunRequest } from './models/run-request';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    LanguageSelectorComponent,
    CodeEditorComponent,
    InputPanelComponent,
    OutputPanelComponent
  ],
  template: `
    <div class="container-fluid py-4 min-vh-100 transition-all">
      <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h1 class="h2 m-0 fw-bold">
          <i class="bi bi-terminal-box me-2 text-primary"></i>Online Code Compiler
        </h1>

        <button class="btn btn-outline-secondary d-flex align-items-center gap-2" (click)="toggleTheme()">
          <i class="bi" [ngClass]="currentTheme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'"></i>
          <span>{{ currentTheme === 'light' ? 'Dark Mode' : 'Light Mode' }}</span>
        </button>
      </div>

      <div class="row g-4">
        <div class="col-lg-8">
          <div class="card shadow-sm p-3 mb-4">
            <div class="row align-items-end g-2 mb-3">
              <div class="col-sm-6 col-md-4">
                <app-language-selector
                  [selectedLanguage]="selectedLanguage"
                  (languageChanged)="onLanguageChanged($event)">
                </app-language-selector>
              </div>
            </div>

            <app-code-editor
              [language]="selectedLanguage"
              [code]="code"
              [theme]="currentTheme"
              (codeChanged)="onCodeChanged($event)"
              #codeEditor>
            </app-code-editor>

            <button
              class="btn btn-primary btn-lg w-100 shadow-sm mt-2 d-flex align-items-center justify-content-center gap-2"
              (click)="runCode()"
              [disabled]="isRunning">
              <span *ngIf="!isRunning" class="d-flex align-items-center gap-2">
                <i class="bi bi-play-fill fs-5"></i> Run Code
              </span>
              <span *ngIf="isRunning" class="d-flex align-items-center gap-2">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Running Execution Lifecycle...
              </span>
            </button>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card shadow-sm p-3 h-100">
            <app-input-panel
              [input]="input"
              (inputChanged)="onInputChanged($event)">
            </app-input-panel>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <app-output-panel
          [stdout]="stdout"
          [stderr]="stderr"
          [exitCode]="exitCode"
          [executionTimeMs]="executionTimeMs">
        </app-output-panel>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger mt-3 d-flex align-items-center gap-2 shadow-sm" role="alert">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <div>{{ errorMessage }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      transition: background-color 0.25s ease;
    }
  `]
})
export class AppComponent implements OnInit {
  @ViewChild('codeEditor') codeEditor?: CodeEditorComponent;

  selectedLanguage: string = 'cpp';
  code: string = this.getDefaultCodeForLang(this.selectedLanguage);
  input: string = '';
  stdout: string = '';
  stderr: string = '';
  exitCode: number = -1;
  executionTimeMs: number = 0;
  isRunning: boolean = false;
  errorMessage: string = '';

  // Native theme control state
  currentTheme: 'light' | 'dark' = 'dark';

  constructor(
    private compilerService: CompilerService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit() {
    this.checkHealth();
    // Set default dark styling wrapper parameters to html element layer node object model structure mapping engine directly
    this.applyThemeAttribute();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyThemeAttribute();
  }

  private applyThemeAttribute() {
    // 🌟 This natively commands Bootstrap 5 to instantly shift colors of all standard components
    this.renderer.setAttribute(this.document.documentElement, 'data-bs-theme', this.currentTheme);
  }

  onLanguageChanged(language: string) {
    this.selectedLanguage = language;
    this.stdout = '';
    this.stderr = '';
    this.exitCode = -1;
    this.executionTimeMs = 0;
    this.code = this.getDefaultCodeForLang(this.selectedLanguage);
  }

  onCodeChanged(code: string) {
    this.code = code;
  }

  onInputChanged(input: string) {
    this.input = input;
  }

  runCode() {
    if (!this.code.trim()) {
      this.errorMessage = 'Please enter some code to run';
      return;
    }

    this.isRunning = true;
    this.errorMessage = '';
    this.stdout = '';
    this.stderr = '';
    this.exitCode = -1;
    this.executionTimeMs = 0;

    const request: RunRequest = {
      language: this.selectedLanguage,
      code: this.code,
      input: this.input
    };

    this.compilerService.run(request).subscribe({
      next: (response) => {
        console.log('received response:', response);
        this.stdout = response.stdout;
        this.stderr = response.stderr;
        this.exitCode = response.exitCode;
        this.executionTimeMs = response.executionTimeMs;
        this.isRunning = false;
        this.cdr.detectChanges();
        this.cdr.markForCheck();
        if (!response.success && response.message) {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isRunning = false;
        this.errorMessage = error.error?.message || 'An error occurred while running the code';
        this.stderr = JSON.stringify(error.error?.errors || error.message);
        console.error('Error occurred while running code:', error);
      }
    });
  }

  private checkHealth() {
    this.compilerService.getHealth().subscribe({
      next: () => console.log('Backend is healthy'),
      error: (error) => {
        console.warn('Backend health check failed:', error);
        this.errorMessage = 'Cannot connect to the backend server';
      }
    });
  }

  private getDefaultCodeForLang(lang: string): string {
    const templates: { [key: string]: string } = {
      cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
      python: `print("Hello, World!")`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    };
    return templates[lang] || '';
  }
}
