import { ProductImageService } from './product-image.service';

describe('ProductImageService Apilo token source', () => {
  it('uploads with the current backend token, not a token from the workstation JWT', async () => {
    const post = jest.fn().mockResolvedValue({ data: { uuid: 'uploaded-image' } });
    const getAccessToken = jest.fn().mockResolvedValue('current-token');
    const service = new ProductImageService(
      { axiosRef: { post } } as any,
      {} as any,
      { getAccessToken } as any,
    );

    await expect(service.addImgInApilo(Buffer.from('image'), {
      shoperToken: 'shoper-token',
      apiloToken: 'stale-token',
    })).resolves.toEqual({ uuid: 'uploaded-image' });
    expect(post).toHaveBeenCalledWith(expect.any(String), expect.any(Buffer), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer current-token' }),
    }));
  });
});
