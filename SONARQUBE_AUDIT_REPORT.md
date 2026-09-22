# Auditoría final definitiva SonarQube — Frontend PIXEL

Fecha: 2026-09-21  
Proyecto Sonar: `pixel-frontend` (`Pixel Frontend`)  
Servidor verificado: `http://localhost:9001`

## Resultado final verificado

| Métrica | Inicio de esta ronda | Resultado final |
| --- | ---: | ---: |
| Quality Gate | PASSED | **PASSED** |
| Overall Security Rating | A | **A** |
| Overall Reliability Rating | A | **A** |
| Overall Maintainability Rating | A | **A** |
| Overall Coverage | 55.9% | **81.6%** |
| Overall Line Coverage | 59.0% | **88.2%** |
| Overall Branch Coverage | 52.8% | **75.1%** |
| Overall Duplications | 0.4% | **0.4%** |
| Overall Bugs | 0 | **0** |
| Overall Vulnerabilities | 0 | **0** |
| Overall Code Smells | 387 | **328** |
| Reliability impacts abiertos | 59 | **0** |
| New Coverage | — | **91.1%** |
| New Duplications | — | **0.0%** |
| New Violations | — | **0** |

Resultado obtenido directamente desde la API de SonarQube después del análisis final `715326d6-90f2-4a1f-a8c9-98050d347127`. La tarea de cómputo terminó en `SUCCESS` y el Quality Gate respondió `OK`.

Las tres condiciones del Gate quedaron conformes:

- cobertura de código nuevo: 91.1% (umbral mínimo 80%);
- duplicación de código nuevo: 0.0% (máximo 3%);
- violaciones nuevas: 0 (máximo 0).

## Trabajo realizado

### Corrección de issues de código productivo

Se resolvieron los 59 impactos de fiabilidad abiertos que existían al inicio:

- 34 incidencias `javascript:S6772` de espaciado JSX;
- 20 incidencias `javascript:S6844` por enlaces sin semántica válida;
- 5 incidencias `javascript:S6853` de asociación/etiquetado accesible.

Las correcciones se concentraron en `LandingPage`, registro, cotizaciones, pedidos, diseño, servicios y permisos. Se conservaron rutas, navegación, contratos API, permisos y reglas de negocio.

### Cobertura real

La cobertura se elevó mediante pruebas ejecutables de comportamiento, sin exclusiones artificiales. Los bloques principales ampliados fueron:

- repositorios y adaptadores de abonos, pedidos, compras, proveedores, productos, roles, permisos, tarifas, cotizaciones públicas y autenticación;
- modales de abonos/comprobantes, compras, proveedores, pedidos, cotizaciones y propuestas;
- páginas de dashboard, cotizaciones, técnicas, productos, clientes, usuarios, pedidos y diseños;
- hooks de listados, dashboard, roles y operaciones CRUD;
- utilidades de almacenamiento, archivos protegidos, paginación, formatos, notificaciones y borrado seguro;
- navegación protegida y acciones de tabla.

No se añadió `NOSONAR`, no se aceptaron issues, no se marcaron falsos positivos y no se amplió `sonar.coverage.exclusions`.

## Pruebas y cobertura local

- Total final: **149 archivos de prueba, 734 tests, 734 aprobados**.
- Comando: `npm run test:coverage`.
- LCOV importado: `coverage/lcov.info`.
- Statements V8: **83.77%** (`7216/8614`).
- Branches V8: **75.13%** (`7376/9817`).
- Functions V8: **80.04%** (`1962/2451`).
- Lines V8: **86.37%** (`6544/7576`).
- Cobertura combinada local de líneas y condiciones: **80.03%** (`13920/17393`).

SonarQube importó el LCOV correctamente y calculó una cobertura Overall de 81.6%. La diferencia con el resumen V8 proviene del modelo de líneas ejecutables de Sonar; ambos resultados superan el mínimo obligatorio.

## Validación técnica

- `npm run test:coverage`: **734/734 aprobados**.
- `npm run lint`: aprobado, 0 errores y 0 warnings.
- `npm run build`: aprobado; 3142 módulos transformados.
- Artefactos principales: CSS 381.09 kB, chunk `src` 17.23 kB y bundle principal 1,505.50 kB.
- Permanece el warning informativo de Vite por un chunk mayor de 500 kB.
- Se conservaron la estrategia de imports y las cargas dinámicas existentes.

## Iteraciones Sonar de esta ronda

Se completaron dos análisis reales con `@sonar/scan` 5.0.0 y Java 21 aprovisionado por el scanner:

1. Cobertura 81.6%, ratings A/A/A y 0 impactos de fiabilidad; el Gate detectó 7 issues nuevos `javascript:S9020` en pruebas por usar `waitFor + getBy*`.
2. Se sustituyeron esas consultas por `findBy*`, se verificaron las suites afectadas y el análisis final quedó con **0 New Violations y Quality Gate PASSED**.

En cada análisis se creó un token efímero y se revocó inmediatamente después. No se guardaron credenciales ni tokens en el repositorio o en este informe.

## Estado final de SonarQube

- Quality Gate: **PASSED**.
- Security: **A**.
- Reliability: **A**.
- Maintainability: **A**.
- Coverage: **81.6%**.
- Line coverage: **88.2%**.
- Branch coverage: **75.1%**.
- Duplicación: **0.4%**.
- Bugs: **0**.
- Vulnerabilidades: **0**.
- Impactos de fiabilidad abiertos: **0**.
- Code smells históricos restantes: **328**.

Los 328 code smells históricos no impiden el rating A ni el Quality Gate. No se intentó eliminarlos mediante reescrituras masivas porque la ronda exigía preservar comportamiento, diseño, rendimiento y arquitectura.

## Warning del scanner

El scanner mostró `Missing blame information` para archivos modificados o nuevos del workspace. El análisis detectó el repositorio y una revisión SCM, pero no pudo atribuir blame a esos archivos en el estado actual. El warning no afectó cobertura, ratings ni Quality Gate. No se ejecutó Git ni se creó un commit para ocultarlo.

## Confirmaciones de alcance

- NO backend, Prisma ni base de datos.
- NO cambios de endpoints, contratos API, permisos, estados o reglas de negocio.
- NO cambios al Quality Gate, Quality Profile, reglas Sonar o New Code Definition.
- NO `NOSONAR`, Accepted Issues ni False Positive.
- NO exclusiones artificiales de código productivo para cobertura.
- NO dependencias permanentes nuevas para el scanner.
- NO Git, commit, push ni deploy.
