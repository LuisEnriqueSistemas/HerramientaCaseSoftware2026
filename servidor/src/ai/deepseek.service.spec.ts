import { BadGatewayException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DeepseekService } from './deepseek.service';

describe('DeepseekService', () => {
  const originalFetch = global.fetch;
  const values: Record<string, string> = {
    DEEPSEEK_URL: 'https://api.deepseek.com/v1',
    API_KEY_DEEPSEEK: 'sk-test',
    DEEPSEEK_MODEL: 'deepseek-chat',
  };
  const configService = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;

  function mockFetch(response: unknown): jest.Mock {
    const mock = jest.fn().mockResolvedValue(response);
    global.fetch = mock;
    return mock;
  }

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('reporta disponible cuando DeepSeek lista el modelo configurado', async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 'deepseek-chat' }] }),
    });

    await expect(
      new DeepseekService(configService).getStatus(),
    ).resolves.toEqual({
      available: true,
      provider: 'deepseek',
      model: 'deepseek-chat',
      message: 'Proveedor disponible',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/models',
      expect.objectContaining({
        headers: { Authorization: 'Bearer sk-test' },
      }),
    );
  });

  it('explica cuando falta API_KEY_DEEPSEEK sin llamar a la red', async () => {
    const withoutKey = {
      get: jest.fn((key: string) =>
        key === 'API_KEY_DEEPSEEK' ? undefined : values[key],
      ),
    } as unknown as ConfigService;
    const fetchMock = mockFetch(null);

    const status = await new DeepseekService(withoutKey).getStatus();
    expect(status.available).toBe(false);
    expect(status.message).toContain('API_KEY_DEEPSEEK');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explica cuando DeepSeek no responde', async () => {
    mockFetch(null);

    const status = await new DeepseekService(configService).getStatus();
    expect(status.available).toBe(false);
    expect(status.message).toContain('no responde');
  });

  it('normaliza el diagrama desde choices de chat completions', async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  classes: [
                    {
                      name: 'Cliente',
                      attributes: [
                        {
                          visibility: 'private',
                          name: 'id',
                          type: 'INT',
                          keyType: 'PK',
                        },
                      ],
                    },
                  ],
                  relations: [],
                }),
              },
            },
          ],
        }),
    });

    const result = await new DeepseekService(configService).generateDiagram(
      'Crea Cliente',
      {},
    );

    expect(result).toEqual({
      classes: [
        {
          name: 'Cliente',
          attributes: [
            expect.objectContaining({
              visibility: 'private',
              name: 'id',
              type: 'INT',
              keyType: 'PK',
              nullable: false,
            }),
          ],
          methods: [],
        },
      ],
      relations: [],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lanza 502 cuando la respuesta no contiene JSON válido', async () => {
    mockFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'no-json' } }],
        }),
    });

    await expect(
      new DeepseekService(configService).generateDiagram('Crea Cliente', {}),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('normaliza tipos OOP a ER (String -> VARCHAR, Integer -> INT)', async () => {
    mockFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  classes: [
                    {
                      name: 'Pedido',
                      attributes: [
                        {
                          visibility: 'private',
                          name: 'total',
                          type: 'String',
                        },
                        {
                          visibility: 'private',
                          name: 'cantidad',
                          type: 'VARCHAR(255)',
                        },
                      ],
                    },
                  ],
                  relations: [],
                }),
              },
            },
          ],
        }),
    });

    const result = await new DeepseekService(configService).generateDiagram(
      'Crea Pedido',
      {},
    );

    expect(result.classes[0].attributes[0].type).toBe('VARCHAR');
    expect(result.classes[0].attributes[1].type).toBe('VARCHAR');
  });

  it('normaliza REALIZATION e INHERITANCE a ASSOCIATION', async () => {
    mockFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  classes: [{ name: 'A' }, { name: 'B' }],
                  relations: [
                    { source: 'A', target: 'B', type: 'INHERITANCE' },
                    { source: 'A', target: 'B', type: 'REALIZATION' },
                  ],
                }),
              },
            },
          ],
        }),
    });

    const result = await new DeepseekService(configService).generateDiagram(
      'Crea relaciones',
      {},
    );

    expect(result.relations[0].type).toBe('ASSOCIATION');
    expect(result.relations[1].type).toBe('ASSOCIATION');
  });
});
