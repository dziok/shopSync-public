import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { ProductService } from './product.service';

describe('Apilo update target', () => {
  const createService = (products: Array<{ id: number; sku: string }>, totalCount = products.length) => {
    const get = jest.fn().mockResolvedValue({ data: { products, totalCount } });
    const put = jest.fn().mockResolvedValue({ data: { updated: true } });
    const service = new ProductService({ axiosRef: { get, put } } as any, {} as any, {} as any);
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
    const service = new ProductService({ axiosRef: { post, get } } as any, {} as any, {} as any);

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
    const service = new ProductService({ axiosRef: { post, get } } as any, {} as any, {} as any);

    await expect(service.addInShoper({}, tokens)).rejects.toMatchObject({
      response: {
        shoperError: { error_description: "Attribute '913' has invalid option value" },
      },
    });
  });
});
