import type { ErrorRequestHandler } from "express";
import createHttpError from "http-errors";
import { ZodError } from "zod";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation invalide.",
      issues: error.flatten()
    });

    return;
  }

  const httpError = createHttpError.isHttpError(error)
    ? error
    : createHttpError(500, "Une erreur interne est survenue.");

  res.status(httpError.statusCode).json({
    message: httpError.message
  });
};
