export interface Response<T> {
  success: boolean;
  message?: string;
  data?: T;
  key?: string;
}
