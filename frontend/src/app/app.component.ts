import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    <div class="container-fluid mt-4">
      <h1 class="mb-4">Online Code Compiler</h1>

      <div class="row">
        <div class="col-md-8">
          <app-language-selector
            [selectedLanguage]="selectedLanguage"
            (languageChanged)="onLanguageChanged($event)">
          </app-language-selector>

          <app-code-editor
            [language]="selectedLanguage"
            [code]="code"
            (codeChanged)="onCodeChanged($event)"
            #codeEditor>
          </app-code-editor>

          <button
            class="btn btn-primary btn-lg w-100 mb-3"
            (click)="runCode()"
            [disabled]="isRunning">
            <span *ngIf="!isRunning">Run Code</span>
            <span *ngIf="isRunning">
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Running...
            </span>
          </button>
        </div>

        <div class="col-md-4">
          <app-input-panel
            [input]="input"
            (inputChanged)="onInputChanged($event)">
          </app-input-panel>
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

      <div *ngIf="errorMessage" class="alert alert-danger mt-3" role="alert">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background-color: #f5f5f5;
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  @ViewChild('codeEditor') codeEditor?: CodeEditorComponent;

  selectedLanguage: string = 'cpp';
  code: string = '';
  input: string = '';
  stdout: string = '';
  stderr: string = '';
  exitCode: number = -1;
  executionTimeMs: number = 0;
  isRunning: boolean = false;
  errorMessage: string = '';

  constructor(private compilerService: CompilerService) { }

  ngOnInit() {
    this.checkHealth();
  }

  onLanguageChanged(language: string) {
    this.selectedLanguage = language;
    this.code = '';
    this.stdout = '';
    this.stderr = '';
    this.exitCode = -1;
    this.executionTimeMs = 0;
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
        this.stdout = response.stdout;
        this.stderr = response.stderr;
        this.exitCode = response.exitCode;
        this.executionTimeMs = response.executionTimeMs;
        this.isRunning = false;

        if (!response.success && response.message) {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isRunning = false;
        this.errorMessage = error.error?.message || 'An error occurred while running the code';
        this.stderr = JSON.stringify(error.error?.errors || error.message);
        console.error('Compilation error:', error);
      }
    });
  }

  private checkHealth() {
    this.compilerService.getHealth().subscribe({
      next: () => {
        console.log('Backend is healthy');
      },
      error: (error) => {
        console.warn('Backend health check failed:', error);
        this.errorMessage = 'Cannot connect to the backend server';
      }
    });
  }
}
