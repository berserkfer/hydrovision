# HydroVision

Plataforma inteligente para el monitoreo de la calidad del agua del **río Reque** (Lambayeque, Perú). Proyecto de tesis de Ingeniería Ambiental.

## Estado actual: Fase 1

- Arquitectura documentada
- Estructura de carpetas modular
- Dashboard prototipo funcional con **datos simulados**
- Clasificación ECA básica (Cumple / En alerta / No cumple)
- Stubs preparados para Google Earth Engine, IA y reportes PDF

## Documentación

- [Arquitectura del sistema](docs/ARCHITECTURE.md)
- [Roadmap por fases](docs/ROADMAP.md)
- [Modelo de datos](docs/DATA-MODEL.md)

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
cd C:\Users\ferch\Projects\hydrovision
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Estilos | Tailwind CSS 4 |
| Gráficos | Recharts |
| Mapas (Fase 2) | Leaflet |
| BD (Fase 3) | PostgreSQL + Prisma |
| Satélite (Fase 4) | Google Earth Engine |
| IA (Fase 6) | Python FastAPI |

## Aviso sobre datos

Todos los valores mostrados en Fase 1 son **simulados** y están etiquetados como tales. No deben usarse como evidencia científica hasta integrar mediciones de campo y GEE reales.

## Próxima fase

**Fase 2:** Mapa interactivo Leaflet con puntos P1–P6 y panel de índices satelitales simulados.
