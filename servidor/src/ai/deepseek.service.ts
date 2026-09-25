import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GeneratedClass,
  GeneratedDiagram,
  GeneratedRelation,
} from './interfaces/ai.types';
import type {
  UmlClassAttribute,
  UmlClassMethod,
} from '../uml/entities/uml-class-node.entity';
import { UmlRelationType } from '../uml/entities/uml-relation.entity';

@Injectable()
export class DeepseekService {
  constructor(private readonly configService: ConfigService) {}

  private readonly baseUrl = () =>
    (
      this.configService.get<string>('DEEPSEEK_URL') ??
      'https://api.deepseek.com/v1'
    ).replace(/\/$/, '');

  private readonly apiKey = () =>
    this.configService.get<string>('API_KEY_DEEPSEEK') ?? '';

  private readonly model = () =>
    this.configService.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';

  async getStatus(): Promise<{
    available: boolean;
    provider: 'deepseek';
    model: string;
    message: string;
  }> {
    const model = this.model();
    const apiKey = this.apiKey();
    if (!apiKey) {
      return {
        available: false,
        provider: 'deepseek',
        model,
        message: 'Falta API_KEY_DEEPSEEK en el servidor',
      };
    }
    const response = await fetch(`${this.baseUrl()}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    }).catch(() => null);
    if (!response?.ok) {
      return {
        available: false,
        provider: 'deepseek',
        model,
        message: 'DeepSeek no responde en la URL configurada',
      };
    }
    const body = (await response.json()) as {
      data?: Array<{ id?: string }>;
    };
    const installed = body.data?.some((item) => item.id === model);
    return {
      available: Boolean(installed),
      provider: 'deepseek',
      model,
      message: installed
        ? 'Proveedor disponible'
        : `El modelo ${model} no está disponible en DeepSeek`,
    };
  }

  async generateDiagram(
    prompt: string,
    context: unknown,
  ): Promise<GeneratedDiagram> {
    const model = this.model();
    const apiKey = this.apiKey();
    const response = await fetch(`${this.baseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente UML. Devuelve SIEMPRE un JSON válido con la forma { "classes": [...], "relations": [...] }. Cada clase debe tener name, attributes y methods. Cada atributo debe tener visibility, name y type EXCLUSIVAMENTE de [INT, SMALLINT, BIGINT, DECIMAL, NUMERIC, FLOAT, DOUBLE, CHAR, VARCHAR, TEXT, DATE, TIME, DATETIME, TIMESTAMP, BOOLEAN, BIT, BLOB, VARBINARY, UUID] y puede incluir keyType ("PK", "FK" o "NONE"), nullable (boolean), unique (boolean), isCompositeKey (boolean), referencesEntityId y referencesAttributeId. Si el estado actual trae atributos con keyType "PK" o "FK", devuélvelos tal cual sin quitarles la clave. Cada método debe tener visibility, name, parameters como texto y returnType como texto. Cada relación debe tener source, target, type EXCLUSIVAMENTE de [ASSOCIATION, AGGREGATION, COMPOSITION], sourceMin, sourceMax, targetMin y targetMax. Si necesitas INHERITANCE o REALIZATION usa ASSOCIATION. Para uno a muchos usa sourceMin=1, sourceMax=1, targetMin=1, targetMax=null. No incluyas texto fuera del JSON.',
          },
          {
            role: 'user',
            content: `Estado actual:\n${JSON.stringify(context)}\n\nSolicitud:\n${prompt}\nResponde únicamente en json.`,
          },
        ],
      }),
    }).catch(() => null);

    if (!response?.ok) {
      throw new BadGatewayException(
        response?.status === 401
          ? 'API_KEY_DEEPSEEK inválida o sin acceso al modelo'
          : response?.status === 404
            ? `El modelo ${model} no está disponible en DeepSeek`
            : 'DeepSeek no responde en la URL configurada',
      );
    }
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new BadGatewayException(
        'El proveedor de IA no devolvió una respuesta válida',
      );
    }
    try {
      return this.normalizeDiagram(JSON.parse(content));
    } catch {
      throw new BadGatewayException(
        'La respuesta de IA no contiene JSON válido',
      );
    }
  }

  private normalizeDiagram(value: unknown): GeneratedDiagram {
    if (!value || typeof value !== 'object') {
      throw new BadGatewayException(
        'La IA devolvió una estructura UML inválida',
      );
    }
    const raw = value as {
      classes?: unknown[];
      relations?: unknown[];
    };
    if (!Array.isArray(raw.classes) || !Array.isArray(raw.relations)) {
      throw new BadGatewayException('La IA debe devolver clases y relaciones');
    }
    const classes = raw.classes.map((item) => this.normalizeClass(item));
    const relations = raw.relations.map((item) => this.normalizeRelation(item));
    return { classes, relations };
  }

  private normalizeClass(value: unknown): GeneratedClass {
    if (!value || typeof value !== 'object') {
      throw new BadGatewayException('La IA devolvió una clase inválida');
    }
    const raw = value as Record<string, unknown>;
    if (typeof raw.name !== 'string') {
      throw new BadGatewayException('La IA devolvió una clase sin nombre');
    }
    const attributes: UmlClassAttribute[] = Array.isArray(raw.attributes)
      ? raw.attributes.map((attribute) => {
          if (!attribute || typeof attribute !== 'object') {
            throw new BadGatewayException(
              'La IA devolvió un atributo inválido',
            );
          }
          const item = attribute as Record<string, unknown>;
          if (typeof item.name !== 'string' || typeof item.type !== 'string') {
            throw new BadGatewayException(
              'La IA devolvió un atributo incompleto',
            );
          }
          const normalizedType = this.normalizeAttributeType(item.type);
          const visibility =
            item.visibility === 'public' ||
            item.visibility === 'private' ||
            item.visibility === 'protected'
              ? item.visibility
              : 'private';
          const keyType =
            item.keyType === 'PK' ||
            item.keyType === 'FK' ||
            item.keyType === 'NONE'
              ? item.keyType
              : undefined;
          const normalized: UmlClassAttribute = {
            visibility,
            name: item.name,
            type: normalizedType,
            id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
          };
          if (keyType !== undefined) normalized.keyType = keyType;
          if (typeof item.nullable === 'boolean') {
            normalized.nullable = item.nullable;
          } else if (keyType === 'PK') {
            normalized.nullable = false;
          }
          if (typeof item.isCompositeKey === 'boolean') {
            normalized.isCompositeKey = item.isCompositeKey;
          }
          if (typeof item.unique === 'boolean') {
            normalized.unique = item.unique;
          }
          if (typeof item.referencesEntityId === 'string') {
            normalized.referencesEntityId = item.referencesEntityId;
          }
          if (typeof item.referencesAttributeId === 'string') {
            normalized.referencesAttributeId = item.referencesAttributeId;
          }
          return normalized;
        })
      : [];
    const methods: UmlClassMethod[] = Array.isArray(raw.methods)
      ? raw.methods.map((method) => {
          if (!method || typeof method !== 'object') {
            throw new BadGatewayException('La IA devolvió un método inválido');
          }
          const item = method as Record<string, unknown>;
          if (typeof item.name !== 'string') {
            throw new BadGatewayException(
              'La IA devolvió un método sin nombre',
            );
          }
          const visibility =
            item.visibility === 'public' ||
            item.visibility === 'private' ||
            item.visibility === 'protected'
              ? item.visibility
              : 'public';
          const parameters = Array.isArray(item.parameters)
            ? item.parameters.join(', ')
            : typeof item.parameters === 'string'
              ? item.parameters
              : '';
          const returnType =
            typeof item.returnType === 'string'
              ? item.returnType
              : typeof item.return === 'string'
                ? item.return
                : 'void';
          return { visibility, name: item.name, parameters, returnType };
        })
      : [];
    return {
      name: raw.name,
      attributes,
      methods,
      ...(typeof raw.x === 'number' ? { x: raw.x } : {}),
      ...(typeof raw.y === 'number' ? { y: raw.y } : {}),
    };
  }

  private normalizeRelation(value: unknown): GeneratedRelation {
    if (!value || typeof value !== 'object') {
      throw new BadGatewayException('La IA devolvió una relación inválida');
    }
    const item = value as Record<string, unknown>;
    if (typeof item.source !== 'string' || typeof item.target !== 'string') {
      throw new BadGatewayException('La IA devolvió una relación incompleta');
    }
    const rawType =
      typeof item.type === 'string' && item.type.length > 0
        ? item.type.toUpperCase()
        : 'ASSOCIATION';
    const type = this.normalizeRelationType(rawType);
    const result: GeneratedRelation = {
      source: item.source,
      target: item.target,
      type,
    };
    if (typeof item.sourceMin === 'number') result.sourceMin = item.sourceMin;
    if (item.sourceMax === null || typeof item.sourceMax === 'number')
      result.sourceMax = item.sourceMax;
    if (typeof item.targetMin === 'number') result.targetMin = item.targetMin;
    if (item.targetMax === null || typeof item.targetMax === 'number')
      result.targetMax = item.targetMax;
    if (typeof item.sourceRole === 'string')
      result.sourceRole = item.sourceRole;
    if (typeof item.targetRole === 'string')
      result.targetRole = item.targetRole;
    return result;
  }

  private normalizeAttributeType(rawType: string): string {
    const cleaned = rawType
      .trim()
      .toUpperCase()
      .replace(/\s*\(.+\)\s*$/, '');
    const aliases: Record<string, string> = {
      STRING: 'VARCHAR',
      INTEGER: 'INT',
      LONG: 'BIGINT',
      SHORT: 'SMALLINT',
      DOUBLE: 'DOUBLE',
      FLOAT: 'FLOAT',
      BOOL: 'BOOLEAN',
      BOOLEN: 'BOOLEAN',
      BOOLENA: 'BOOLEAN',
    };
    if (aliases[cleaned]) {
      return aliases[cleaned];
    }
    if (cleaned === 'VARCHAR2') {
      return 'VARCHAR';
    }
    return cleaned;
  }

  private normalizeRelationType(rawType: string): GeneratedRelation['type'] {
    if (
      rawType === UmlRelationType.INHERITANCE ||
      rawType === UmlRelationType.REALIZATION ||
      rawType === UmlRelationType.DEPENDENCY
    ) {
      return UmlRelationType.ASSOCIATION;
    }
    if (
      rawType === UmlRelationType.ASSOCIATION ||
      rawType === UmlRelationType.AGGREGATION ||
      rawType === UmlRelationType.COMPOSITION
    ) {
      return rawType;
    }
    return UmlRelationType.ASSOCIATION;
  }
}
