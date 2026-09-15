import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { mapDatabaseError } from '../utils/errorFunctions';

type JsonObject = Record<string, unknown>;
type StoredLayout = { id: number; schema: string };
type StoredSnapshot = { id: number; layoutSchema: string };

const isObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null;

const repairHeaderBlocks = (blocks: unknown): { value: unknown; changed: boolean } => {
  if (!Array.isArray(blocks)) return { value: blocks, changed: false };

  let changed = false;
  const value = blocks.map(block => {
    if (!isObject(block)) return block;
    const next: JsonObject = { ...block };

    if (block.type === 'row' && Array.isArray(block.children)) {
      const hasLogo = block.children.some(child => isObject(child) && child.type === 'logo');
      const businessIndex = block.children.findIndex(child => isObject(child) && child.type === 'businessInfo');
      if (hasLogo && businessIndex >= 0) {
        if (next.justify === 'between') {
          delete next.justify;
          changed = true;
        }
        if (next.gap === undefined) {
          next.gap = 5;
          changed = true;
        }
        next.children = block.children.map((child, index) => {
          if (index === businessIndex && isObject(child) && child.width === undefined) {
            changed = true;
            return { ...child, width: '50%' };
          }
          return child;
        });
      }
    }

    if (Array.isArray(next.children)) {
      const repaired = repairHeaderBlocks(next.children);
      next.children = repaired.value;
      changed ||= repaired.changed;
    }

    return next;
  });

  return { value, changed };
};

const repairLayout = (schemaText: string): { schemaText: string; changed: boolean } => {
  let schema: unknown;
  try {
    schema = JSON.parse(schemaText);
  } catch {
    return { schemaText, changed: false };
  }
  if (!isObject(schema)) return { schemaText, changed: false };

  let changed = false;
  const repairSection = (section: unknown) => {
    if (!isObject(section) || section.type !== 'header') return;
    const repaired = repairHeaderBlocks(section.blocks);
    if (repaired.changed) {
      section.blocks = repaired.value;
      changed = true;
    }
  };

  if (schema.schemaVersion === 1 && Array.isArray(schema.sections)) {
    schema.sections.forEach(repairSection);
  }

  if (schema.schemaVersion === 2 && Array.isArray(schema.regions)) {
    const visit = (node: unknown) => {
      if (!isObject(node)) return;
      if (node.type === 'section') repairSection(node.section);
      if (Array.isArray(node.children)) node.children.forEach(visit);
    };

    schema.regions.forEach(region => {
      if (!isObject(region)) return;
      if (Array.isArray(region.blocks)) {
        const repaired = repairHeaderBlocks(region.blocks);
        if (repaired.changed) {
          region.blocks = repaired.value;
          changed = true;
        }
      }
      if (Array.isArray(region.children)) region.children.forEach(visit);
    });
  }

  return { schemaText: changed ? JSON.stringify(schema) : schemaText, changed };
};

export const up = async (db: DatabaseAdapter) => {
  try {
    const layouts = await db.all<StoredLayout>('SELECT "id", "schema" FROM layouts');
    for (const layout of layouts) {
      const repaired = repairLayout(layout.schema);
      if (repaired.changed) {
        await db.run('UPDATE layouts SET "schema" = ? WHERE "id" = ?', [repaired.schemaText, layout.id]);
      }
    }

    const snapshots = await db.all<StoredSnapshot>('SELECT "id", "layoutSchema" FROM invoice_layout_snapshots');
    for (const snapshot of snapshots) {
      const repaired = repairLayout(snapshot.layoutSchema);
      if (repaired.changed) {
        await db.run('UPDATE invoice_layout_snapshots SET "layoutSchema" = ? WHERE "id" = ?', [
          repaired.schemaText,
          snapshot.id
        ]);
      }
    }
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
