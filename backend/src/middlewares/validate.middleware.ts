import type { AnyZodObject, ZodTypeAny } from "zod";
import type { RequestHandler } from "express";

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: AnyZodObject): RequestHandler {
  return (req, _res, next) => {
    req.query = schema.parse(req.query);
    next();
  };
}
