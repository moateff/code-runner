import { ChangeDetectorRef, Component, OnInit, ViewChild, Renderer2, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
    LanguageSelectorComponent,
    CodeEditorComponent,
    InputPanelComponent,
    OutputPanelComponent
  ],
  template: `
    <div class="d-flex flex-column vh-100 overflow-hidden font-sans">

      <header class="d-flex align-items-center justify-content-between px-3 custom-tab-bar border-bottom" style="height: 50px;">
        <div class="d-flex align-items-center gap-2">
          <span class="text-success fw-bold fs-4">&lt;/&gt;</span>
          <span class="fw-bold fs-5 tracking-tight text-white font-monospace">OneCompiler</span>
        </div>

        <div class="d-flex align-items-center gap-3">
          <app-language-selector
            [selectedLanguage]="selectedLanguage"
            (languageChanged)="onLanguageChanged($event)">
          </app-language-selector>

          <button
            class="btn text-dark fw-bold d-flex align-items-center justify-content-center gap-2 px-4 rounded-pill shadow-sm run-btn"
            (click)="runCode()"
            [disabled]="isRunning">
            <i class="bi" [ngClass]="isRunning ? 'bi-arrow-repeat spin' : 'bi-play-fill fs-4'"></i>
            <span>{{ isRunning ? 'Running...' : 'Run' }}</span>
          </button>
        </div>

        <div class="d-flex align-items-center">
          <button
            class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center px-2 border-0 shadow-none text-secondary"
            style="height: 32px;"
            (click)="toggleTheme()"
            title="Toggle Light/Dark Workspace Mode">
            <i class="bi fs-5" [ngClass]="currentTheme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill text-warning'"></i>
          </button>
        </div>
      </header>

      <div class="d-flex flex-grow-1 overflow-hidden position-relative">
        <main class="d-flex flex-grow-1 row m-0 p-0 w-100 overflow-hidden">

          <section class="col-md-7 p-0 h-100 d-flex flex-column border-end custom-editor-section">
            <div class="d-flex align-items-center px-2 custom-tab-bar" style="height: 35px;">
              <div class="active-code-tab px-3 h-100 d-flex align-items-center gap-2 font-monospace fs-6">
                <i class="bi bi-file-earmark-code text-primary"></i> {{ getSourceFileName(selectedLanguage) }}
              </div>
            </div>

            <div class="flex-grow-1 w-100 overflow-hidden">
              <app-code-editor
                [language]="selectedLanguage"
                [code]="code"
                [theme]="currentTheme"
                (codeChanged)="onCodeChanged($event)"
                #codeEditor>
              </app-code-editor>
            </div>
          </section>

          <section class="col-md-5 p-0 h-100 d-flex flex-column overflow-hidden custom-console-section">

            <div class="border-bottom d-flex align-items-center justify-content-between px-2 custom-tab-bar" style="height: 35px;">
              <ul class="nav nav-tabs border-0 font-monospace h-100 align-items-end" style="font-size: 14px;">
                <li class="nav-item h-100">
                  <button class="nav-link tab-btn h-100" [ngClass]="{'active-terminal-tab': activeTab === 'output'}" (click)="activeTab = 'output'">
                    <i class="bi bi-terminal me-1"></i> Console
                  </button>
                </li>
                <li class="nav-item h-100">
                  <button class="nav-link tab-btn h-100" [ngClass]="{'active-terminal-tab': activeTab === 'input'}" (click)="activeTab = 'input'">
                    <i class="bi bi-box-arrow-in-right me-1"></i> I/O
                  </button>
                </li>
              </ul>

              <div class="text-muted font-monospace px-2 fs-7" *ngIf="executionTimeMs > 0">
                <i class="bi bi-stopwatch text-warning me-1"></i>{{ executionTimeMs }}ms
              </div>
            </div>

            <div class="flex-grow-1 p-3 overflow-hidden position-relative custom-terminal-body">
              <div class="h-100 overflow-hidden" [hidden]="activeTab !== 'output'">
                <app-output-panel
                  [stdout]="stdout"
                  [stderr]="stderr"
                  [exitCode]="exitCode"
                  [executionTimeMs]="executionTimeMs">
                </app-output-panel>
              </div>

              <div class="h-100 overflow-hidden" [hidden]="activeTab !== 'input'">
                <app-input-panel
                  [input]="input"
                  (inputChanged)="onInputChanged($event)">
                </app-input-panel>
              </div>
            </div>
          </section>

        </main>
      </div>

      <div *ngIf="errorMessage" class="position-fixed bottom-0 end-0 m-3 alert alert-danger shadow-lg d-flex align-items-center gap-2 border-0 fs-5" style="z-index: 999; background-color: #d32f2f; color: #fff;" role="alert">
        <i class="bi bi-exclamation-octagon-fill"></i>
        <div>{{ errorMessage }}</div>
        <button type="button" class="btn-close btn-close-white small ms-2" (click)="errorMessage = ''"></button>
      </div>

    </div>
  `,
  styles: [`
    .spin { animation: rotation 0.8s infinite linear; }
    @keyframes rotation { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .font-sans { font-family: system-ui, -apple-system, sans-serif; }
    .tracking-tight { letter-spacing: -0.5px; }
    .fs-7 { font-size: 12px; }

    /* ─── DYNAMIC CLASS HOOK THEME DESIGN VARIABLES ─── */
    :host-context([data-bs-theme="dark"]) {
      --bg-tab-bar: #18181c;
      --bg-editor-panel: #1e1e1e;
      --bg-terminal-panel: #141416;
      --border-color: rgba(255, 255, 255, 0.12);
      --tab-text-color: #8e8e93;
      --active-tab-text: #ffffff;
    }

    :host-context([data-bs-theme="light"]) {
      --bg-tab-bar: #f5f5f7;
      --bg-editor-panel: #ffffff;
      --bg-terminal-panel: #f5f5f7;
      --border-color: rgba(0, 0, 0, 0.12);
      --tab-text-color: #6e6e73;
      --active-tab-text: #000000;
    }

    .custom-editor-section { background-color: var(--bg-editor-panel); border-color: var(--border-color) !important; }
    .custom-console-section { border-color: var(--border-color) !important; }
    .custom-tab-bar { background-color: var(--bg-tab-bar); border-color: var(--border-color) !important; }
    .custom-terminal-body { background-color: var(--bg-terminal-panel); }

    /* OneCompiler Custom Green Run Button Spec Matching */
    .run-btn {
      background-color: #00e676 !important;
      font-size: 15px;
      height: 32px;
      transition: background-color 0.15s ease;
    }
    .run-btn:hover { background-color: #00c853 !important; }

    .active-code-tab {
      background-color: var(--bg-editor-panel);
      border-top: 2px solid #00e676;
      color: var(--active-tab-text) !important;
      font-weight: 600;
    }

    .tab-btn {
      color: var(--tab-text-color);
      border: none !important;
      background: transparent;
      padding: 0 15px !important;
      display: flex;
      align-items: center;
      font-weight: 600;
    }
    .tab-btn:hover { color: var(--active-tab-text); }

    .active-terminal-tab {
      color: var(--active-tab-text) !important;
      border-bottom: 2px solid #00e676 !important;
      background-color: rgba(255, 255, 255, 0.02) !important;
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

  activeTab: 'input' | 'output' = 'output';
  currentTheme: 'dark' | 'light' = 'dark';

  constructor(
    private compilerService: CompilerService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit() {
    this.applyThemeAttribute();
    this.checkHealth();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyThemeAttribute();
  }

  private applyThemeAttribute() {
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
    this.activeTab = 'output';

    const request: RunRequest = {
      language: this.selectedLanguage,
      code: this.code,
      input: this.input
    };

    this.compilerService.run(request).subscribe({
      next: (response) => {
        this.stdout = response.stdout;
        this.stderr = response.stderr;
        this.exitCode = response.exitCode;
        this.executionTimeMs = response.executionTimeMs;
        this.isRunning = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isRunning = false;
        this.errorMessage = 'Sandbox execution connection timed out.';
        this.stderr = error.error?.message || error.message;
      }
    });
  }

  getSourceFileName(language: string): string {
    const fileNames: { [key: string]: string } = { cpp: 'Main.cpp', python: 'main.py', java: 'Main.java' };
    return fileNames[language] || 'main.txt';
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
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      python: `print("Hello, World!")`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    };
    return templates[lang] || '';
  }
}
