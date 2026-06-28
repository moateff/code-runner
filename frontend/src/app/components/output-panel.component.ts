import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-output-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column h-100 font-monospace" style="font-size: 14px;">

      <div class="flex-grow-1 overflow-auto p-2 p-sm-3 border rounded custom-terminal-box">
        <div *ngIf="stdout" class="pre-wrap text-output-color">{{ stdout }}</div>

        <div *ngIf="stderr" class="text-danger-stream pre-wrap">
          <i class="bi bi-exclamation-circle-fill me-1"></i>Runtime Trace Error:\n{{ stderr }}
        </div>

        <div *ngIf="!stdout && !stderr" class="text-muted d-flex flex-column align-items-center justify-content-center h-100 small">
          <i class="bi bi-terminal fs-4 mb-2 opacity-50"></i>
          <span>Live Console Stream Active.</span>
        </div>
      </div>

      <div class="d-flex align-items-center justify-content-between pt-2 mt-2 border-top font-sans text-muted" style="font-size: 13px; border-color: var(--bs-border-color) !important;">
        <div class="d-flex align-items-center gap-2 w-100 justify-content-between justify-content-sm-start">
          <span class="fw-bold text-label-color">Process Exit Code:</span>

          <span *ngIf="exitCode === -1" class="badge bg-secondary text-white fw-bold px-2 py-1">Ready</span>

          <span *ngIf="exitCode === 0" class="badge bg-success text-white fw-bold px-2 py-1">
            <i class="bi bi-check-circle-fill me-1"></i>0 (Success)
          </span>
          <span *ngIf="exitCode > 0" class="badge bg-danger text-white fw-bold px-2 py-1">
            <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ exitCode }} (Failed)
          </span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pre-wrap { white-space: pre-wrap; word-wrap: break-word; font-family: 'Fira Code', Consolas, monospace; }
    .text-danger-stream { color: #ff5252; font-weight: 500; }
    .font-sans { font-family: system-ui, -apple-system, sans-serif; }

    .custom-terminal-box {
      background-color: var(--bs-body-bg);
      border-color: var(--bs-border-color) !important;
      border-radius: 6px;
    }

    @media (min-width: 768px) {
      :host { font-size: 15px !important; }
      .font-sans { font-size: 14px !important; }
    }

    :host-context([data-bs-theme="dark"]) {
      .text-output-color { color: #ffffff; }
      .text-label-color { color: #ffffff; }
    }
    :host-context([data-bs-theme="light"]) {
      .text-output-color { color: #111111; }
      .text-label-color { color: #222222; }
    }
  `]
})
export class OutputPanelComponent {
  @Input() stdout: string = '';
  @Input() stderr: string = '';
  @Input() exitCode: number = -1;
  @Input() executionTimeMs: number = 0;
}
