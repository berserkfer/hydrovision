# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Fernando Chumpen (autor de la tesis), su asesor y el jurado: usan la plataforma para demostrar y sustentar la tesis de Ingeniería Ambiental.
- Técnicos e ingenieros de campo: toman muestras y fotos del agua, a veces sin conexión a internet.
- Autoridades e instituciones (ANA, OEFA, DIRESA, municipio): consultarían el estado del agua del Dren 4000 para decidir.

## Product Purpose

HydroVision es una plataforma de monitoreo de calidad de agua del Dren 4000 (Santa Rosa, Lambayeque, Perú). Combina datos de laboratorio, imágenes Sentinel-2, estimaciones por foto de celular y modelos estadísticos. El éxito es que cada número que muestra declare de dónde viene y qué tan confiable es.

## Positioning

Una plataforma que nunca presenta un número sin decir su origen, su nivel de confianza y sus límites. No disfraza estimaciones genéricas como mediciones calibradas ni fabrica datos, coeficientes o alertas.

## Operating Context

- Tesis de pregrado; datos reales publicados (Nizama y Cabrera, 2014; 20 registros) mezclados con datos simulados de demostración en otras cuencas, siempre rotulados.
- Satélite: Sentinel-2 L2A vía Microsoft Planetary Computer (principal; público, sin credenciales) con Copernicus Data Space como respaldo opcional si se configuran sus credenciales OAuth. Cada observación y cada par de calibración registra su proveedor. Ver `docs/SATELLITE_PROVIDER.md`.
- Campo: fotos con celular siguiendo el método HydroColor (Leeuw y Boss, 2018).
- Entorno actual: datos en memoria (mock), sin base de datos PostgreSQL real.

## Capabilities and Constraints

- Predicción satelital de SST y turbidez; hay un mínimo de 4 pares y 3 fechas distintas para marcar algo como calibrado.
- Modelo ambiental sin satélite (datos 2014, N=10 por matriz; sin multivariado).
- Foto de celular con tres niveles de confianza y modo offline (PWA).
- Vegetación: NDVI agrícola y NDCI de laguna de oxidación, con umbral de alerta configurable.
- Terminología fija: SST (Sólidos Suspendidos Totales, ópticamente activo) y STD (Sólidos Disueltos Totales, solo laboratorio) nunca se mezclan; la vegetación agrícola y la de la laguna tampoco.
- Todo el contenido está en español.
- Sin datos suficientes, el sistema dice "sin datos suficientes para evaluar" en vez de arriesgar un resultado.

## Brand Commitments

Tono técnico-científico en español, con términos precisos (SST, STD, NDVI, NDCI). Sistema visual "Papel y corriente" (oct. 2026): fondo papel claro, tinta añil (navy), tipografías Hanken Grotesk + IBM Plex Mono, textura de corrientes como elemento gráfico decorativo (nunca como dato). El tema oscuro queda como variante opcional ("tinta nocturna").

## Evidence on Hand

- `src/data/mock/dren-4000-real-data.ts`: 20 registros reales de 2014 (10 puntos, 2 campañas).
- No hay datos de campo recientes ni coliformes aprovechables para calibración satelital.
- No existen testimonios, usuarios reales ni despliegue público: no se deben inventar.

## Product Principles

1. La honestidad sobre el origen y la confianza de cada dato pesa más que la estética.
2. Nunca se fabrican datos, coeficientes ni alertas sin un cálculo real detrás.
3. Cada dato indica su origen (satélite, foto, laboratorio, simulado) y no se mezclan fuentes sin decirlo.
4. Lo más importante de cada módulo (resultado y nivel de confianza) se ve primero.

## Accessibility & Inclusion

Debe ser legible al aire libre (con sol) y en pantallas pequeñas de celular, porque el uso de campo es un caso real.
