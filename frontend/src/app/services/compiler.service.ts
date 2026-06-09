import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RunRequest } from '../models/run-request';
import { RunResponse } from '../models/run-response';

@Injectable({
  providedIn: 'root'
})
export class CompilerService {
  private apiUrl = `${environment.apiUrl}/compiler`;

  constructor(private http: HttpClient) { }

  run(request: RunRequest): Observable<RunResponse> {
    return this.http.post<RunResponse>(`${this.apiUrl}/run`, request);
  }

  getHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
