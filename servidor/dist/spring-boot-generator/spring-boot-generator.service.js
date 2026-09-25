"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SpringBootGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpringBootGeneratorService = exports.SPRING_BOOT_OPTIONAL_DEPS = exports.SPRING_BOOT_BASELINE_DEPS = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const handlebars_1 = __importDefault(require("handlebars"));
const jszip_1 = __importDefault(require("jszip"));
const uml_diagram_service_1 = require("../uml/uml-diagram.service");
const uml_relation_entity_1 = require("../uml/entities/uml-relation.entity");
exports.SPRING_BOOT_BASELINE_DEPS = [
    'web',
    'jpa',
    'postgresql',
    'lombok',
    'test',
];
exports.SPRING_BOOT_OPTIONAL_DEPS = [
    'validation',
    'security',
    'actuator',
    'devtools',
    'mapstruct',
    'flyway',
];
const KNOWN_DEPS = new Set([
    ...exports.SPRING_BOOT_BASELINE_DEPS,
    ...exports.SPRING_BOOT_OPTIONAL_DEPS,
]);
const ER_TO_JAVA = {
    INT: { javaType: 'Integer' },
    SMALLINT: { javaType: 'Short' },
    BIGINT: { javaType: 'Long' },
    DECIMAL: { javaType: 'BigDecimal', import: 'java.math.BigDecimal' },
    NUMERIC: { javaType: 'BigDecimal', import: 'java.math.BigDecimal' },
    FLOAT: { javaType: 'Float' },
    DOUBLE: { javaType: 'Double' },
    CHAR: { javaType: 'String' },
    VARCHAR: { javaType: 'String' },
    TEXT: { javaType: 'String' },
    DATE: { javaType: 'LocalDate', import: 'java.time.LocalDate' },
    TIME: { javaType: 'LocalTime', import: 'java.time.LocalTime' },
    DATETIME: { javaType: 'LocalDateTime', import: 'java.time.LocalDateTime' },
    TIMESTAMP: { javaType: 'LocalDateTime', import: 'java.time.LocalDateTime' },
    BOOLEAN: { javaType: 'Boolean' },
    BIT: { javaType: 'Boolean' },
    BLOB: { javaType: 'byte[]' },
    VARBINARY: { javaType: 'byte[]' },
    UUID: { javaType: 'UUID', import: 'java.util.UUID' },
};
const SUPPORTED = new Set([
    uml_relation_entity_1.UmlRelationType.ASSOCIATION,
    uml_relation_entity_1.UmlRelationType.AGGREGATION,
    uml_relation_entity_1.UmlRelationType.COMPOSITION,
]);
function words(v) {
    return v
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean);
}
function toPascal(v, fb) {
    const p = words(v);
    if (!p.length)
        return fb;
    let n = p.map((s) => s[0].toUpperCase() + s.slice(1).toLowerCase()).join('');
    if (/^[0-9]/.test(n))
        n = `_${n}`;
    return n;
}
function toCamel(v, fb) {
    const p = toPascal(v, fb);
    return p[0].toLowerCase() + p.slice(1);
}
function toSnake(v) {
    const p = words(v);
    return p.length ? p.map((s) => s.toLowerCase()).join('_') : 'unnamed';
}
function plural(v) {
    return v.endsWith('s') ? `${v}es` : `${v}s`;
}
function sanitize(seg, fb) {
    const c = seg.toLowerCase().replace(/[^a-z0-9_]/g, '');
    return !c || /^[0-9]/.test(c) ? fb : c;
}
let SpringBootGeneratorService = SpringBootGeneratorService_1 = class SpringBootGeneratorService {
    umlDiagramService;
    logger = new common_1.Logger(SpringBootGeneratorService_1.name);
    constructor(umlDiagramService) {
        this.umlDiagramService = umlDiagramService;
    }
    async generateZip(userId, projectId, options = {}) {
        const diagram = await this.umlDiagramService.getDiagram(userId, projectId);
        const warnings = [];
        const extras = this.parseDeps(options.deps ?? []);
        const config = this.buildConfig(diagram.projectId, options);
        const tables = this.buildModel(diagram.nodes, diagram.edges, warnings);
        const files = this.buildFiles(config, tables, extras, warnings);
        for (const w of warnings)
            this.logger.warn(w);
        const buffer = await this.zipFiles(files);
        return { filename: `${config.artifactId}.zip`, buffer, warnings };
    }
    buildFilesForTest(nodes, edges, options = {}) {
        const warnings = [];
        const extras = this.parseDeps(options.deps ?? []);
        const config = this.buildConfig('test-project', options);
        const tables = this.buildModel(nodes, edges, warnings);
        const files = this.buildFiles(config, tables, extras, warnings);
        return { files, warnings, config };
    }
    areTypesCompatible(targetType, sourceType) {
        const norm = (t) => t.trim().toUpperCase().replace(/\s*\(.+\)\s*$/, '');
        const s = norm(sourceType);
        const t = norm(targetType);
        if (s === t)
            return true;
        const compat = {
            SMALLINT: ['INT', 'BIGINT'],
            INT: ['BIGINT'],
            FLOAT: ['DOUBLE'],
            CHAR: ['VARCHAR', 'TEXT'],
            VARCHAR: ['TEXT'],
        };
        return compat[t]?.includes(s) ?? false;
    }
    parseDeps(deps) {
        const n = deps.map((d) => d.trim().toLowerCase()).filter(Boolean);
        const unk = n.filter((d) => !KNOWN_DEPS.has(d));
        if (unk.length)
            throw new common_1.BadRequestException(`Dependencias no soportadas: ${unk.join(', ')}. Válidas: ${[...KNOWN_DEPS].join(', ')}`);
        return new Set(n);
    }
    buildConfig(projectId, options) {
        const short = projectId.replace(/-/g, '').slice(0, 8) || 'app';
        const artifactId = (options.artifactId ?? `diagram-${short}`)
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'diagram-app';
        const groupId = (options.groupId ?? 'com.example')
            .split('.')
            .map((p, i) => sanitize(p, i === 0 ? 'com' : 'app'))
            .join('.');
        const basePackage = options.basePackage
            ? options.basePackage
                .split('.')
                .map((p, i) => sanitize(p, i === 0 ? 'com' : 'app'))
                .join('.')
            : `${groupId}.app`;
        return {
            groupId,
            artifactId,
            basePackage,
            dbName: artifactId.replace(/-/g, '_'),
        };
    }
    buildModel(nodes, edges, warnings) {
        if (!nodes.length)
            throw new common_1.BadRequestException('El diagrama no tiene tablas para generar');
        const seenT = new Map();
        for (const n of nodes) {
            const t = toSnake(n.tableName ?? n.name);
            const k = t.toLowerCase();
            const o = seenT.get(k);
            if (o && o !== n.id)
                throw new common_1.BadRequestException(`Nombre de tabla duplicado: ${t}`);
            seenT.set(k, n.id);
        }
        const tables = new Map();
        const byTable = new Map();
        for (const node of nodes) {
            const className = toPascal(node.tableName ?? node.name, 'Entidad');
            const tableName = toSnake(node.tableName ?? node.name);
            const seenA = new Set();
            const fields = [];
            for (const a of node.attributes ?? []) {
                const key = (a.name ?? '').trim().toLowerCase();
                if (!key)
                    throw new common_1.BadRequestException(`La tabla ${tableName} tiene un atributo sin nombre`);
                if (seenA.has(key))
                    throw new common_1.BadRequestException(`Atributo duplicado en ${tableName}: ${a.name}`);
                seenA.add(key);
                const er = (a.type ?? '').trim().toUpperCase();
                const m = ER_TO_JAVA[er];
                if (!m)
                    throw new common_1.BadRequestException(`Tipo de dato no soportado en ${tableName}.${a.name}: ${a.type}`);
                let fieldName = toCamel(a.name, 'campo');
                if (fields.some((f) => f.fieldName === fieldName))
                    fieldName = `${fieldName}_`;
                fields.push({
                    attrName: a.name,
                    fieldName,
                    columnName: toSnake(a.name),
                    javaType: m.javaType,
                    imports: m.import ? [m.import] : [],
                    pk: a.keyType === 'PK',
                    nullable: a.keyType === 'PK' ? false : a.nullable !== false,
                    unique: a.unique === true,
                    fk: undefined,
                });
            }
            const pkFields = fields.filter((f) => f.pk);
            if (!pkFields.length)
                throw new common_1.BadRequestException(`La tabla ${tableName} no tiene clave primaria`);
            const composite = pkFields.length > 1;
            const idJavaType = composite
                ? `${className}Id`
                : (pkFields[0]?.javaType ?? 'Long');
            const t = {
                nodeId: node.id,
                className,
                tableName,
                description: node.description ?? null,
                fields,
                pkFields,
                composite,
                idJavaType,
                inverse: [],
            };
            tables.set(node.id, t);
            byTable.set(tableName.toLowerCase(), t);
        }
        for (const e of edges) {
            if (!SUPPORTED.has(e.type)) {
                warnings.push(`Relación ${e.id} ignorada: tipo ${e.type} no soportado por el generador Spring Boot v1`);
            }
        }
        for (const t of tables.values()) {
            for (const f of t.fields) {
                const node = nodes.find((n) => n.id === t.nodeId);
                const raw = node?.attributes?.find((a) => a.name === f.attrName);
                if (!raw || raw.keyType !== 'FK')
                    continue;
                const refNode = nodes.find((n) => n.id === raw.referencesEntityId);
                const refTable = refNode
                    ? byTable.get(toSnake(refNode.tableName ?? refNode.name).toLowerCase())
                    : undefined;
                if (!refNode || !refTable)
                    throw new common_1.BadRequestException(`La FK ${t.tableName}.${f.attrName} referencia una tabla inexistente`);
                const refAttr = refNode.attributes?.find((a) => a.id === raw.referencesAttributeId);
                if (!refAttr) {
                    throw new common_1.BadRequestException(`La FK ${t.tableName}.${f.attrName} debe referenciar una columna existente`);
                }
                if (refAttr.unique !== true && refAttr.keyType !== 'PK') {
                    warnings.push(`FK ${t.tableName}.${f.attrName} referencia columna no única ${refTable.tableName}.${refAttr.name}`);
                }
                if (!this.areTypesCompatible(refAttr.type, raw.type)) {
                    throw new common_1.BadRequestException(`El tipo de la FK ${t.tableName}.${f.attrName} (${f.javaType}) no es compatible con ${refTable.tableName}.${refAttr.name} (${refAttr.type})`);
                }
                const refField = refTable.fields.find((x) => x.attrName === refAttr.name);
                if (!refField)
                    throw new common_1.BadRequestException(`La FK ${t.tableName}.${f.attrName} referencia una columna inexistente`);
                let refFieldName = toCamel(refTable.className, 'ref');
                const taken = new Set(t.fields.map((x) => x.fieldName));
                while (taken.has(refFieldName))
                    refFieldName = `${refFieldName}Ref`;
                f.fk = {
                    refTable,
                    refColumn: refField.columnName,
                    refField: refFieldName,
                    optional: f.nullable,
                };
                let inv = plural(toCamel(t.className, 'items'));
                let s = 2;
                const base = inv;
                while (refTable.inverse.some((x) => x.field === inv)) {
                    inv = `${base}${s}`;
                    s += 1;
                }
                refTable.inverse.push({
                    field: inv,
                    target: t.className,
                    mappedBy: refFieldName,
                });
            }
        }
        return [...tables.values()];
    }
    buildFiles(config, tables, extras, warnings) {
        const files = [
            { path: 'pom.xml', content: this.renderPom(config, extras) },
            {
                path: 'src/main/resources/application.properties',
                content: this.renderProps(config),
            },
            {
                path: `src/main/java/${config.basePackage.replace(/\./g, '/')}/Application.java`,
                content: this.renderApp(config),
            },
            {
                path: 'README.md',
                content: this.renderReadme(config, extras, warnings),
            },
        ];
        for (const t of tables)
            files.push(...this.renderTable(config, t, extras));
        return files;
    }
    renderPom(config, extras) {
        try {
            const source = fs.readFileSync(path.join(__dirname, 'templates/pom.hbs'), 'utf8');
            const template = handlebars_1.default.compile(source, { noEscape: true });
            return template({
                groupId: config.groupId,
                artifactId: config.artifactId,
                javaVersion: '17',
                lombokVersion: '1.18.38',
                hasValidation: extras.has('validation'),
                hasSecurity: extras.has('security'),
                hasActuator: extras.has('actuator'),
                hasDevtools: extras.has('devtools'),
                hasMapstruct: extras.has('mapstruct'),
                hasFlyway: extras.has('flyway'),
            });
        }
        catch {
            const dep = (g, a, e = '') => `        <dependency>\n            <groupId>${g}</groupId>\n            <artifactId>${a}</artifactId>${e}\n        </dependency>`;
            const lines = [
                dep('org.springframework.boot', 'spring-boot-starter-web'),
                dep('org.springframework.boot', 'spring-boot-starter-data-jpa'),
                dep('org.postgresql', 'postgresql', '\n            <scope>runtime</scope>'),
                dep('org.projectlombok', 'lombok', '\n            <optional>true</optional>'),
                dep('org.springframework.boot', 'spring-boot-starter-test', '\n            <scope>test</scope>'),
            ];
            if (extras.has('validation'))
                lines.push(dep('org.springframework.boot', 'spring-boot-starter-validation'));
            if (extras.has('security'))
                lines.push(dep('org.springframework.boot', 'spring-boot-starter-security'));
            if (extras.has('actuator'))
                lines.push(dep('org.springframework.boot', 'spring-boot-starter-actuator'));
            if (extras.has('devtools'))
                lines.push(dep('org.springframework.boot', 'spring-boot-devtools', '\n            <scope>runtime</scope>\n            <optional>true</optional>'));
            if (extras.has('mapstruct'))
                lines.push(dep('org.mapstruct', 'mapstruct', '\n            <version>1.5.5.Final</version>'));
            if (extras.has('flyway'))
                lines.push(dep('org.flywaydb', 'flyway-core'));
            const procs = [
                '                <path>\n                    <groupId>org.projectlombok</groupId>\n                    <artifactId>lombok</artifactId>\n                    <version>${lombok.version}</version>\n                </path>',
            ];
            if (extras.has('mapstruct'))
                procs.push('                <path>\n                    <groupId>org.mapstruct</groupId>\n                    <artifactId>mapstruct-processor</artifactId>\n                    <version>1.5.5.Final</version>\n                </path>');
            return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.2.5</version><relativePath/></parent>
    <groupId>${config.groupId}</groupId><artifactId>${config.artifactId}</artifactId><version>0.0.1-SNAPSHOT</version><name>${config.artifactId}</name><description>Generado desde el diseñador ER colaborativo</description>
    <properties><java.version>17</java.version><lombok.version>1.18.38</lombok.version></properties>
    <dependencies>
${lines.join('\n')}
    </dependencies>
    <build><plugins><plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><version>3.14.0</version><configuration><annotationProcessorPaths>
${procs.join('\n')}
                </annotationProcessorPaths></configuration></plugin><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId><configuration><excludes><exclude><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId></exclude></excludes></configuration></plugin></plugins></build>
</project>
`;
        }
    }
    renderProps(config) {
        return `server.port=8080\nspring.datasource.url=jdbc:postgresql://localhost:5432/${config.dbName}\nspring.datasource.username=postgres\nspring.datasource.password=postgres\nspring.jpa.hibernate.ddl-auto=validate\nspring.jpa.open-in-view=false\nspring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect\n`;
    }
    renderApp(config) {
        return `package ${config.basePackage};\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class Application {\n    public static void main(String[] args) { SpringApplication.run(Application.class, args); }\n}\n`;
    }
    renderReadme(config, extras, warnings) {
        const lines = [
            `# ${config.artifactId}`,
            '',
            'Proyecto generado desde el diseñador ER colaborativo. AST con ' +
                config.artifactId +
                '.',
            '',
            '## Requisitos',
            '',
            '- Java 17+',
            '- Maven 3.8+',
            '- PostgreSQL `CREATE DATABASE ' + config.dbName + ';`',
            '',
            '## Ejecución',
            '',
            '```bash',
            'mvn spring-boot:run',
            '```',
            '',
            'ddl-auto=validate',
            '',
        ];
        if (extras.size)
            lines.push('## Extras', '', ...[...extras].map((e) => `- ${e}`), '');
        lines.push('## Notas v1', '', '- security/mapstruct solo dependencia.', '- REALIZATION/DEPENDENCY ignoradas.', '- N:M como tabla puente.', '');
        if (warnings.length)
            lines.push('## Advertencias', '', ...warnings.map((w) => `- ${w}`), '');
        lines.push('## Plantillas', '', 'Generado vía Handlebars (entity.hbs, repository.hbs, service.hbs, controller.hbs) compiladas contra el AST ProjectAst.', '');
        return lines.join('\n') + '\n';
    }
    renderTable(config, t, extras) {
        const base = `src/main/java/${config.basePackage.replace(/\./g, '/')}`;
        const files = [
            {
                path: `${base}/entity/${t.className}.java`,
                content: this.renderEntity(config, t, extras),
            },
            {
                path: `${base}/repository/${t.className}Repository.java`,
                content: this.renderRepo(config, t),
            },
            {
                path: `${base}/service/${t.className}Service.java`,
                content: this.renderService(config, t),
            },
            {
                path: `${base}/controller/${t.className}Controller.java`,
                content: this.renderController(config, t),
            },
            {
                path: `${base}/dto/${t.className}RequestDTO.java`,
                content: this.renderDto(config, t, 'Request'),
            },
            {
                path: `${base}/dto/${t.className}ResponseDTO.java`,
                content: this.renderDto(config, t, 'Response'),
            },
        ];
        if (t.composite)
            files.push({
                path: `${base}/entity/${t.className}Id.java`,
                content: this.renderId(config, t),
            });
        if (extras.has('security'))
            files.push({
                path: `${base}/security/SecurityConfig.java`,
                content: `package ${config.basePackage}.security;\nimport org.springframework.context.annotation.*;\nimport org.springframework.security.config.annotation.web.builders.HttpSecurity;\nimport org.springframework.security.web.SecurityFilterChain;\n@Configuration public class SecurityConfig { @Bean public SecurityFilterChain chain(HttpSecurity http) throws Exception { http.csrf(c->c.disable()).authorizeHttpRequests(a->a.anyRequest().permitAll()); return http.build(); } }`,
            }, {
                path: `${base}/security/JwtFilter.java`,
                content: `package ${config.basePackage}.security;\nimport jakarta.servlet.*; import org.springframework.stereotype.Component;\n@Component public class JwtFilter implements Filter { public void doFilter(ServletRequest r, ServletResponse s, FilterChain c) throws java.io.IOException, ServletException { c.doFilter(r,s); } }`,
            });
        if (extras.has('flyway'))
            files.push({
                path: 'src/main/resources/db/migration/V1__init.sql',
                content: this.renderFlyway(t),
            });
        return files;
    }
    renderEntity(config, t, extras) {
        const imports = new Set([
            'jakarta.persistence.*',
            'lombok.Data',
            'lombok.NoArgsConstructor',
            'lombok.AllArgsConstructor',
            'lombok.ToString',
            'lombok.EqualsAndHashCode',
            'com.fasterxml.jackson.annotation.JsonIgnore',
        ]);
        for (const f of t.fields)
            for (const i of f.imports)
                imports.add(i);
        if (t.composite)
            imports.add('java.io.Serializable');
        if (extras.has('validation'))
            imports.add('jakarta.validation.constraints.*');
        const fields = [];
        const rels = [];
        for (const f of t.fields) {
            const fk = f.fk;
            if (fk) {
                if (t.composite && f.pk) {
                    fields.push(`    @Column(name = "${f.columnName}"${f.nullable ? '' : ', nullable = false'}${f.unique ? ', unique = true' : ''})`);
                    fields.push(`    private ${f.javaType} ${f.fieldName};`);
                    rels.push('');
                    rels.push('    @ManyToOne(fetch = FetchType.LAZY)');
                    rels.push(`    @JoinColumn(name = "${f.columnName}", referencedColumnName = "${fk.refColumn}", insertable = false, updatable = false)`);
                    rels.push('    @ToString.Exclude');
                    rels.push('    @EqualsAndHashCode.Exclude');
                    rels.push(`    private ${fk.refTable.className} ${fk.refField};`);
                }
                else {
                    rels.push('');
                    rels.push('    @ManyToOne(fetch = FetchType.LAZY)');
                    rels.push(`    @JoinColumn(name = "${f.columnName}", referencedColumnName = "${fk.refColumn}"${fk.optional ? '' : ', nullable = false'})`);
                    rels.push('    @ToString.Exclude');
                    rels.push('    @EqualsAndHashCode.Exclude');
                    rels.push(`    private ${fk.refTable.className} ${fk.refField};`);
                }
            }
            else if (t.composite && f.pk) {
                continue;
            }
            else {
                const ann = this.fieldAnn(f, extras);
                fields.push(ann);
                fields.push(`    private ${f.javaType} ${f.fieldName};`);
            }
        }
        let body = [...fields, ...rels];
        const inv = [];
        for (const s of t.inverse) {
            inv.push('');
            inv.push(`    @OneToMany(mappedBy = "${s.mappedBy}")`);
            inv.push('    @JsonIgnore');
            inv.push('    @ToString.Exclude');
            inv.push('    @EqualsAndHashCode.Exclude');
            inv.push(`    private java.util.List<${s.target}> ${s.field} = new java.util.ArrayList<>();`);
        }
        if (t.composite) {
            body = [
                '    @EmbeddedId',
                `    private ${t.idJavaType} id;`,
                '',
                ...body,
            ];
        }
        body.push(...inv);
        const comment = t.description
            ? `/** ${t.description.replace(/\*\//g, '* /')} */\n`
            : '';
        return `package ${config.basePackage}.entity;\n\n${[...imports]
            .sort()
            .map((i) => `import ${i};`)
            .join('\n')}\n\n${comment}@Data\n@NoArgsConstructor\n@AllArgsConstructor\n@Entity\n@Table(name = "${t.tableName}")\npublic class ${t.className} {\n\n${body.join('\n')}\n}\n`;
    }
    fieldAnn(f, extras) {
        const lines = [];
        if (f.pk)
            lines.push('    @Id');
        lines.push(`    @Column(name = "${f.columnName}"${f.nullable ? '' : ', nullable = false'}${f.unique ? ', unique = true' : ''})`);
        if (extras.has('validation') && !f.nullable)
            lines.push('    @NotNull');
        return lines.join('\n');
    }
    renderId(config, t) {
        const imports = new Set([
            'jakarta.persistence.*',
            'lombok.Data',
            'lombok.NoArgsConstructor',
            'lombok.AllArgsConstructor',
            'java.io.Serializable',
        ]);
        for (const f of t.pkFields)
            for (const i of f.imports)
                imports.add(i);
        const fields = t.pkFields
            .map((f) => `    @Column(name = "${f.columnName}")\n    private ${f.javaType} ${f.fieldName};`)
            .join('\n\n');
        return `package ${config.basePackage}.entity;\n\n${[...imports]
            .sort()
            .map((i) => `import ${i};`)
            .join('\n')}\n\n@Data\n@NoArgsConstructor\n@AllArgsConstructor\n@Embeddable\npublic class ${t.idJavaType} implements Serializable {\n\n${fields}\n}\n`;
    }
    renderRepo(config, t) {
        const idImp = t.composite
            ? `import ${config.basePackage}.entity.${t.idJavaType};\n`
            : '';
        return `package ${config.basePackage}.repository;\n\nimport ${config.basePackage}.entity.${t.className};\n${idImp}import org.springframework.data.jpa.repository.JpaRepository;\nimport org.springframework.stereotype.Repository;\n\n@Repository\npublic interface ${t.className}Repository extends JpaRepository<${t.className}, ${t.idJavaType}> {\n}\n`;
    }
    renderService(config, t) {
        const cap = (v) => v[0].toUpperCase() + v.slice(1);
        const idArgs = t.composite
            ? t.pkFields.map((a) => `${a.javaType} ${a.fieldName}`).join(', ')
            : `${t.pkFields[0]?.javaType ?? 'Long'} id`;
        const idVals = t.composite
            ? t.pkFields.map((a) => a.fieldName).join(', ')
            : 'id';
        const idNew = t.composite ? `new ${t.idJavaType}(${idVals})` : idVals;
        const idImp = t.composite
            ? `import ${config.basePackage}.entity.${t.idJavaType};\n`
            : '';
        return `package ${config.basePackage}.service;\n\nimport ${config.basePackage}.entity.${t.className};\n${idImp}import ${config.basePackage}.repository.${t.className}Repository;\nimport java.util.List;\nimport lombok.RequiredArgsConstructor;\nimport org.springframework.stereotype.Service;\n\n@Service\n@RequiredArgsConstructor\npublic class ${t.className}Service {\n    private final ${t.className}Repository repository;\n    public List<${t.className}> findAll() { return repository.findAll(); }\n    public ${t.className} findById(${idArgs}) { return repository.findById(${idNew}).orElseThrow(() -> new RuntimeException("${t.className} no encontrado")); }\n    public ${t.className} create(${t.className} input) { return repository.save(input); }\n    public ${t.className} update(${idArgs}, ${t.className} input) { ${t.className} existing = findById(${idVals}); return repository.save(existing); }\n    public void delete(${idArgs}) { repository.delete(findById(${idVals})); }\n}\n`;
    }
    renderController(config, t) {
        const plural = t.tableName.endsWith('s')
            ? `${t.tableName}es`
            : `${t.tableName}s`;
        const idVars = t.composite
            ? t.pkFields.map((a) => `/{${a.fieldName}}`).join('')
            : '/{id}';
        const idParams = t.composite
            ? t.pkFields
                .map((a) => `@PathVariable ${a.javaType} ${a.fieldName}`)
                .join(', ')
            : `@PathVariable ${t.pkFields[0]?.javaType ?? 'Long'} id`;
        const idArgs = t.composite
            ? t.pkFields.map((a) => a.fieldName).join(', ')
            : 'id';
        const idImp = t.composite
            ? `import ${config.basePackage}.entity.${t.idJavaType};\n`
            : '';
        return `package ${config.basePackage}.controller;\n\nimport ${config.basePackage}.entity.${t.className};\n${idImp}import ${config.basePackage}.service.${t.className}Service;\nimport java.util.List;\nimport lombok.RequiredArgsConstructor;\nimport org.springframework.http.HttpStatus;\nimport org.springframework.web.bind.annotation.*;\n\n@RestController\n@RequestMapping("/api/${plural}")\n@RequiredArgsConstructor\npublic class ${t.className}Controller {\n    private final ${t.className}Service service;\n    @GetMapping public List<${t.className}> list() { return service.findAll(); }\n    @GetMapping("${idVars}") public ${t.className} get(${idParams}) { return service.findById(${idArgs}); }\n    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ${t.className} create(@RequestBody ${t.className} input) { return service.create(input); }\n    @PutMapping("${idVars}") public ${t.className} update(${idParams}, @RequestBody ${t.className} input) { return service.update(${idArgs}, input); }\n    @DeleteMapping("${idVars}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(${idParams}) { service.delete(${idArgs}); }\n}\n`;
    }
    renderDto(config, t, kind) {
        return `package ${config.basePackage}.dto;\n\nimport lombok.Data; import lombok.NoArgsConstructor; import lombok.AllArgsConstructor;\n@Data @NoArgsConstructor @AllArgsConstructor\npublic class ${t.className}${kind}DTO {\n${t.fields.map((f) => `    private ${f.javaType} ${f.fieldName};`).join('\n')}\n}\n`;
    }
    renderFlyway(t) {
        return `-- Flyway V1 generado para ${t.tableName}\nCREATE TABLE ${t.tableName} (\n${t.fields.map((f) => `    ${f.columnName} ${f.javaType.toUpperCase()}${f.pk ? ' PRIMARY KEY' : ''}${f.nullable ? '' : ' NOT NULL'}${f.unique ? ' UNIQUE' : ''}`).join(',\n')}\n);\n`;
    }
    async zipFiles(files) {
        const zip = new jszip_1.default();
        for (const f of files)
            zip.file(f.path, f.content);
        return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    }
};
exports.SpringBootGeneratorService = SpringBootGeneratorService;
exports.SpringBootGeneratorService = SpringBootGeneratorService = SpringBootGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [uml_diagram_service_1.UmlDiagramService])
], SpringBootGeneratorService);
//# sourceMappingURL=spring-boot-generator.service.js.map