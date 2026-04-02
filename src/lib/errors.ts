export type ErrorType = "bad_request" | "unauthorized" | "forbidden" | "not_found" | "rate_limit" | "offline";

export type Surface = "chat" | "document" | "history" | "api" | "database";

export type ErrorCode = `${ErrorType}:${Surface}`;

export class ChatbotError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    const [type, surface] = errorCode.split(":");
    super(cause ?? getMessageByErrorCode(errorCode));
    this.type = type as ErrorType;
    this.surface = surface as Surface;
    this.statusCode = getStatusCodeByType(this.type);
    this.cause = cause;
  }

  toResponse() {
    return Response.json(
      {
        code: `${this.type}:${this.surface}`,
        message: this.message,
        cause: typeof this.cause === "string" ? this.cause : undefined,
      },
      { status: this.statusCode },
    );
  }
}

function getMessageByErrorCode(errorCode: ErrorCode) {
  switch (errorCode) {
    case "bad_request:api":
      return "The request could not be processed.";
    case "bad_request:chat":
      return "The chat request was invalid.";
    case "unauthorized:chat":
      return "Authentication required.";
    case "forbidden:chat":
      return "You do not have access to this chat.";
    case "not_found:chat":
      return "The requested chat was not found.";
    case "not_found:document":
      return "The requested artifact was not found.";
    case "offline:chat":
      return "The service is temporarily unavailable.";
    default:
      return "Something went wrong.";
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "offline":
      return 503;
    default:
      return 500;
  }
}
