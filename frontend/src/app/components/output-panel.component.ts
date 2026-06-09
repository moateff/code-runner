import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-output-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-success text-white">
            <strong>Output (stdout)</strong>
          </div>
          <div class="card-body" style="height: 200px; overflow-y: auto; background-color: #1e1e1e; color: #d4d4d4; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">
            {{ stdout || '(no output)' }}
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-danger text-white">
            <strong>Error (stderr)</strong>
          </div>
          <div class="card-body" style="height: 200px; overflow-y: auto; background-color: #1e1e1e; color: #d4d4d4; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">
            {{ stderr || '(no errors)' }}
          </div>
        </div>
      </div>
    </div>
    <div class="mt-3 p-3 border rounded bg-light">
      <div>
        <strong>Exit Code:</strong> 
        <span [class]="getExitCodeClass()">{{ exitCode }}</span>
      </div>
      <div *ngIf="executionTimeMs > 0">
        <strong>Execution Time:</strong> {{ executionTimeMs }}ms
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
      return 'badge bg-success';
    } else if (this.exitCode > 0) {
      return 'badge bg-danger';
    }
    return 'badge bg-secondary';
  }
}
