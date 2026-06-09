import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-output-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row g-4">
      <div class="col-md-6">
        <div class="card border-0 shadow-sm overflow-hidden rounded-3">
          <div class="card-header bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-between py-2 border-bottom border-success border-opacity-25">
            <span class="fw-bold small d-flex align-items-center gap-2">
              <i class="bi bi-terminal"></i> Terminal Output (stdout)
            </span>
            <span class="badge bg-success bg-opacity-70 text-white rounded-pill px-2 py-1 small">Output Channel</span>
          </div>
          <div class="card-body font-monospace shadow-inner border" style="height: 220px; overflow-y: auto; background-color: #1e1e1e; color: #ececec; font-size: 13px; white-space: pre-wrap; word-wrap: break-word; padding: 1rem;">{{ stdout || '(no data streamed to output)' }}</div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card border-0 shadow-sm overflow-hidden rounded-3">
          <div class="card-header bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-between py-2 border-bottom border-danger border-opacity-25">
            <span class="fw-bold small d-flex align-items-center gap-2">
              <i class="bi bi-bug-fill"></i> Compilation Diagnostics (stderr)
            </span>
            <span class="badge bg-danger bg-opacity-70 text-white rounded-pill px-2 py-1 small">Error Channel</span>
          </div>
          <div class="card-body font-monospace shadow-inner border" style="height: 220px; overflow-y: auto; background-color: #1e1e1e; color: #ff8b8b; font-size: 13px; white-space: pre-wrap; word-wrap: break-word; padding: 1rem;">{{ stderr || '(no exceptions reported)' }}</div>
        </div>
      </div>
    </div>

    <div class="mt-3 p-3 border rounded shadow-sm d-flex flex-wrap align-items-center gap-4 justify-content-between" style="background-color: var(--bs-card-cap-bg);">
      <div class="d-flex align-items-center gap-2">
        <span class="text-secondary small fw-semibold">Process Status Indicator:</span>
        <span [class]="getExitCodeClass()">
          <i class="bi me-1" [ngClass]="exitCode === 0 ? 'bi-check-circle-fill' : exitCode > 0 ? 'bi-x-circle-fill' : 'bi-dash-circle-fill'"></i>
          {{ exitCode === -1 ? 'Idle/Ready' : 'Exit Code: ' + exitCode }}
        </span>
      </div>
      <div *ngIf="executionTimeMs > 0" class="d-flex align-items-center gap-2 text-secondary small font-monospace">
        <i class="bi bi-stopwatch text-primary fs-5"></i>
        <span>Execution Pipeline Completion Latency: <strong class="text-body">{{ executionTimeMs }}ms</strong></span>
      </div>
    </div>
  `
})
export class OutputPanelComponent {
  @Input() stdout: string = '';
  @Input() stderr: string = '';
  @Input() exitCode: number = -1;
  @Input() executionTimeMs: number = 0;

  getExitCodeClass(): string {
    if (this.exitCode === 0) {
      return 'badge bg-success d-inline-flex align-items-center p-2';
    } else if (this.exitCode > 0) {
      return 'badge bg-danger d-inline-flex align-items-center p-2';
    }
    return 'badge bg-secondary d-inline-flex align-items-center p-2';
  }
}
