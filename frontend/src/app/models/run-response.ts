export interface RunResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  message?: string;
}
