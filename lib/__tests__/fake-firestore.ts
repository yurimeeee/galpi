/**
 * Minimal in-memory stand-in for the parts of `firebase/firestore` that
 * lib/data-service.ts uses, so its write logic (counters, progress, undo
 * round-trips, import dedupe) runs for real without a backend. Documents
 * live in `store`, keyed by full path ("users/u1/books/abc").
 */
type Data = Record<string, unknown>;
type Ref = { path: string; id: string };
type Constraint = { kind: 'where'; field: string; value: unknown } | { kind: 'orderBy' };

const INCREMENT = Symbol('increment');
const DELETE = Symbol('deleteField');

export const store = new Map<string, Data>();
let autoId = 0;

export function resetStore() {
  store.clear();
  autoId = 0;
}

export function docsIn(collectionPath: string): (Data & { id: string })[] {
  return [...store.entries()]
    .filter(([path]) => path.startsWith(`${collectionPath}/`) && !path.slice(collectionPath.length + 1).includes('/'))
    .map(([path, data]) => ({ id: path.split('/').pop()!, ...data }));
}

function apply(existing: Data | undefined, patch: Data, merge: boolean): Data {
  const next: Data = merge ? { ...(existing ?? {}) } : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && (value as { [INCREMENT]?: number })[INCREMENT] !== undefined) {
      next[key] = ((next[key] as number) ?? 0) + (value as { [INCREMENT]: number })[INCREMENT];
    } else if (value === DELETE) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return next;
}

function snapshot(ref: Ref) {
  const data = store.get(ref.path);
  return { id: ref.id, ref, exists: () => data !== undefined, data: () => data };
}

function write(ref: Ref, data: Data, mode: 'set' | 'merge' | 'update') {
  const existing = store.get(ref.path);
  if (mode === 'update' && !existing) throw new Error(`No document to update: ${ref.path}`);
  store.set(ref.path, apply(existing, data, mode !== 'set'));
}

export const firestoreMock = {
  collection: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
  doc: (parent: { path: string }, ...segments: string[]): Ref => {
    if (segments.length === 0) {
      autoId += 1;
      const id = `auto${autoId}`;
      return { path: `${parent.path}/${id}`, id };
    }
    const path = [parent.path, ...segments].filter(Boolean).join('/');
    return { path, id: path.split('/').pop()! };
  },
  query: (col: { path: string }, ...constraints: Constraint[]) => ({ path: col.path, constraints }),
  where: (field: string, _op: string, value: unknown): Constraint => ({ kind: 'where', field, value }),
  orderBy: (): Constraint => ({ kind: 'orderBy' }),
  increment: (n: number) => ({ [INCREMENT]: n }),
  deleteField: () => DELETE,
  getDoc: async (ref: Ref) => snapshot(ref),
  getDocs: async (q: { path: string; constraints?: Constraint[] }) => {
    const wheres = (q.constraints ?? []).filter((c): c is Extract<Constraint, { kind: 'where' }> => c.kind === 'where');
    const docs = docsIn(q.path)
      .filter((d) => wheres.every((w) => d[w.field] === w.value))
      .map((d) => snapshot({ path: `${q.path}/${d.id}`, id: d.id }));
    return { docs };
  },
  setDoc: async (ref: Ref, data: Data, options?: { merge?: boolean }) => write(ref, data, options?.merge ? 'merge' : 'set'),
  updateDoc: async (ref: Ref, data: Data) => write(ref, data, 'update'),
  writeBatch: () => {
    const ops: (() => void)[] = [];
    return {
      set: (ref: Ref, data: Data, options?: { merge?: boolean }) => ops.push(() => write(ref, data, options?.merge ? 'merge' : 'set')),
      update: (ref: Ref, data: Data) => ops.push(() => write(ref, data, 'update')),
      delete: (ref: Ref) => ops.push(() => store.delete(ref.path)),
      commit: async () => ops.forEach((op) => op()),
    };
  },
  runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
    const ops: (() => void)[] = [];
    await fn({
      get: async (ref: Ref) => snapshot(ref),
      set: (ref: Ref, data: Data) => ops.push(() => write(ref, data, 'set')),
      update: (ref: Ref, data: Data) => ops.push(() => write(ref, data, 'update')),
    });
    ops.forEach((op) => op());
  },
  onSnapshot: () => () => {},
};
