export class Result {
  isSuccess: boolean;
  message: string;

  constructor(isSuccess: boolean, message: string) {
    this.isSuccess = isSuccess;
    this.message = message;
  }
}

export class Success<T> extends Result {
  data: T;

  constructor(data: T, message: string = 'Success') {
    super(true, message);
    this.data = data;
  }
}

export class Error extends Result {
  errorCode: number;

  constructor(message: string, errorCode: number = 0) {
    super(false, message);
    this.errorCode = errorCode;
  }
}