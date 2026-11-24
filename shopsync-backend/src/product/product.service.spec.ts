import { BadRequestException, HttpException } from '@nestjs/common';
import axios from 'axios';
import { ProductService } from './product.service';

describe('Apilo update target', () => {
  const createService = (products: Array<{ id: number; sku: string }>, totalCount = products.length) => {
    const get = jest.fn().mockResolvedValue({ data: { products, totalCount } });
    const put = jest.fn().mockResolvedValue({ data: { updated: true } });
    const service = new ProductService({ axiosRef: { get, put } } as any, {} as any, {} as any, { getAccessToken: jest.fn().mockResolvedValue('current-token') } as any);
    return { service, put };
  };

  it('updates the requested ID only when its SKU matches', async () => {
    const { service, put } = createService([
      { id: 10, sku: 'OLD' },
      { id: 20, sku: 'NEW' },
    ]);
    await service.updateApiloProduct({ sku: 'NEW', targetId: 20, name: 'Gaming' }, { apiloToken: 'token' } as any);
    expect(put).toHaveBeenCalledWith(
      expect.stringContaining('/warehouse/product/20/'),
      expect.objectContaining({ sku: 'NEW', name: 'Gaming' }),
      expect.anything(),
    );
  });

  it('does not update another ID when the requested target is absent', async () => {
    const { service, put } = createService([{ id: 10, sku: 'OLD' }]);
    await expect(service.updateApiloProduct({ sku: 'NEW', targetId: 10 }, { apiloToken: 'token' } as any))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(put).not.toHaveBeenCalled();
  });

  it('rejects duplicate SKU matches without an explicit target', async () => {
    const { service, put } = createService([
      { id: 10, sku: 'NEW' },
      { id: 20, sku: 'NEW' },
    ]);
    await expect(service.updateApiloProduct({ sku: 'NEW' }, { apiloToken: 'token' } as any))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(put).not.toHaveBeenCalled();
  });
});

describe('Apilo product creation and lookup failures', () => {
  const tokens = { apiloToken: 'token' } as any;
  const apiloError = (status: number, message: string) => new axios.AxiosError(
    message,
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    { status, statusText: 'Error', data: { message } } as any,
  );

  it('does not retry a failed product POST with another payload shape', async () => {
    const post = jest.fn().mockRejectedValue(apiloError(500, 'Błąd komunikacji z serwerem'));
    const service = new ProductService({ axiosRef: { post } } as any, {} as any, {} as any, { getAccessToken: jest.fn().mockResolvedValue('current-token') } as any);

    await expect(service.addInApilo([{ sku: 'SKU-1' }] as any, tokens)).rejects.toMatchObject({
      response: expect.stringContaining('Sprawdź go po SKU przed ponowieniem'),
    });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('rejects a success response that did not create any product', async () => {
    const post = jest.fn().mockResolvedValue({ data: { products: [] } });
    const service = new ProductService({ axiosRef: { post } } as any, {} as any, {} as any, { getAccessToken: jest.fn().mockResolvedValue('current-token') } as any);

    await expect(service.addInApilo([{ sku: 'SKU-1' }] as any, tokens)).rejects.toBeInstanceOf(HttpException);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('retries a transient product-list GET once before creating anything', async () => {
    const get = jest.fn()
      .mockRejectedValueOnce(apiloError(503, 'Temporary unavailable'))
      .mockResolvedValueOnce({ data: { products: [], totalCount: 0 } });
    const service = new ProductService({ axiosRef: { get } } as any, {} as any, {} as any, { getAccessToken: jest.fn().mockResolvedValue('current-token') } as any);

    await expect(service.apiloProductslist({ sku: 'SKU-1' }, tokens)).resolves.toEqual({ products: [], totalCount: 0 });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('preserves an Apilo authorization failure without retrying the GET', async () => {
    const get = jest.fn().mockRejectedValue(apiloError(401, 'Unauthorized'));
    const service = new ProductService({ axiosRef: { get } } as any, {} as any, {} as any, { getAccessToken: jest.fn().mockResolvedValue('current-token') } as any);

    await expect(service.apiloProductslist({ sku: 'SKU-1' }, tokens)).rejects.toMatchObject({
      response: expect.stringContaining('Odnów połączenie w panelu Apilo'),
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('uses the current backend token for two sessions with stale Apilo tokens', async () => {
    const post = jest.fn().mockResolvedValue({ data: { products: { 'SKU-1': 123 } } });
    const getAccessToken = jest.fn()
      .mockResolvedValueOnce('fresh-token-1')
      .mockResolvedValueOnce('fresh-token-2');
    const service = new ProductService(
      { axiosRef: { post } } as any, {} as any, {} as any, { getAccessToken } as any,
    );

    await service.addInApilo([{ sku: 'SKU-1' }] as any, { shoperToken: 'shoper-1', apiloToken: 'stale-1' });
    await service.addInApilo([{ sku: 'SKU-1' }] as any, { shoperToken: 'shoper-2', apiloToken: 'stale-2' });

    expect(post).toHaveBeenNthCalledWith(1, expect.any(String), expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fresh-token-1' }) }));
    expect(post).toHaveBeenNthCalledWith(2, expect.any(String), expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fresh-token-2' }) }));
  });
});

describe('Shoper attribute errors', () => {
  const addFailure = new axios.AxiosError(
    'Request failed with status code 400',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    { status: 400, statusText: 'Bad Request', data: { error_description: "Attribute '913' has invalid option value" } } as any,
  );
  const tokens = { shoperToken: 'shoper-token' } as any;

  it('includes the Shoper attribute name when its metadata is available', async () => {
    const post = jest.fn().mockRejectedValue(addFailure);
    const get = jest.fn().mockResolvedValue({ data: { name: 'Typ obudowy' } });
    const service = new ProductService({ axiosRef: { post, get } } as any, {} as any, {} as any, { getAccessToken: jest.fn().mockResolvedValue('current-token') } as any);

    await expect(service.addInShoper({}, tokens)).rejects.toMatchObject({
      response: {
        shoperError: {
          error_description: 'Atrybut „Typ obudowy” (ID 913) ma nieprawidłową wartość opcji',
        },
      },
    });
    expect(get).toHaveBeenCalledWith(expect.stringContaining('/attributes/913'), expect.anything());
  });

  it('keeps the original error when attribute metadata cannot be fetched', async () => {
    const post = jest.fn().mockRejectedValue(addFailure);
    const get = jest.fn().mockRejectedValue(new Error('Shoper unavailable'));
    const service = new ProductService({ axiosRef: { post, get } } as any, {} as any, {} as any, { getAccessToken: jest.fn().mockResolvedValue('current-token') } as any);

    await expect(service.addInShoper({}, tokens)).rejects.toMatchObject({
      response: {
        shoperError: { error_description: "Attribute '913' has invalid option value" },
      },
    });
  });
});
