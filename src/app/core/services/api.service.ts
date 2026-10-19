import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Query } from '../models/api.models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  get<T>(path: string, q: Query = {}) {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(q))
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    return this.http.get<T>(this.config.apiUrl + path, { params, timeout: 20000 });
  }
  post<T>(path: string, body: unknown) {
    return this.http.post<T>(this.config.apiUrl + path, body, { timeout: 20000 });
  }
  put<T>(path: string, body: unknown = null) {
    return this.http.put<T>(this.config.apiUrl + path, body, { timeout: 20000 });
  }
  patch<T>(path: string, body: unknown) {
    return this.http.patch<T>(this.config.apiUrl + path, body, { timeout: 20000 });
  }
}
