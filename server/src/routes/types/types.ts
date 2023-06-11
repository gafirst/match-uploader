import type * as e from "express";
import { type Query } from "express-serve-static-core";

export interface IReq<T = void> extends e.Request {
  body: T
}

export interface IReqQuery<T extends Query, U = void> extends e.Request {
  query: T
  body: U
}

export interface IRes extends e.Response {
  locals: Record<string, unknown>
}
