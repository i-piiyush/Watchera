export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}
