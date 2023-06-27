import { Request, Response } from 'express';
import { newAuthSession } from '../../controllers/method/auth';
describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let response: Response;
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });
  test('newAuthSession succeeds', async () => {
    mockRequest.params = { id: 'valid-id' };
    await newAuthSession(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalled();
  });
  test('newAuthSession fails with invalid id', async () => {
    mockRequest.params = { id: 'invalid-id' };
    await newAuthSession(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalled();
  });
});


