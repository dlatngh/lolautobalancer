export class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientError";
  }
}

export class RiotError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RiotError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RiotError);
    }
  }
}

export class GetPuuidError extends RiotError {
  constructor(message: string) {
    super(message);
    this.name = "GetPuuidError";
  }
}

export class GetSummonerError extends RiotError {
  constructor(message: string) {
    super(message);
    this.name = "GetSummonerError";
  }
}

export class GetLeagueError extends RiotError {
  constructor(message: string) {
    super(message);
    this.name = "GetLeagueError";
  }
}
