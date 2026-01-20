/**
 * Base Resource Class
 * All API resources extend this class
 */

import type ACP from './acp';
import type { RequestOptions } from './net/HttpClient';

export abstract class ACPResource {
  protected _acp: ACP;
  protected _basePath: string;

  constructor(acp: ACP, basePath: string) {
    this._acp = acp;
    this._basePath = basePath;
  }

  protected _request<T>(
    method: string,
    path: string,
    params?: object,
    options?: RequestOptions
  ): Promise<T> {
    const fullPath = `${this._basePath}${path}`;
    return this._acp._makeRequest<T>(method, fullPath, params, options);
  }
}
