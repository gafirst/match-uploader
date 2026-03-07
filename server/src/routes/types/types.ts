import type * as e from "express";

export interface IReq<T = void> extends e.Request {
  body: T
}

export interface IRes extends e.Response {
  locals: Record<string, unknown>
}
