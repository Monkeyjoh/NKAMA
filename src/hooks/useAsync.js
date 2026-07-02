import { useCallback, useEffect, useRef, useState } from "react";

/**
 * NKAMA — Hook générique de récupération de données asynchrones.
 *
 * Mutualise les états loading/error/data et le rechargement (`refetch`)
 * pour tous les hooks de domaine. Quand Supabase sera branché, rien ne
 * change ici : seuls les services appelés évolueront.
 *
 * @template T
 * @param {() => Promise<T>} asyncFn  Fonction asynchrone (souvent un service)
 * @param {Array<any>} [deps]         Dépendances de relance
 * @param {T} [initial]              Valeur initiale
 * @returns {{ data: T, loading: boolean, error: Error|null, refetch: () => void, setData: Function }}
 */
export function useAsync(asyncFn, deps = [], initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(asyncFn)
      .then((res) => {
        if (mounted.current) setData(res);
      })
      .catch((err) => {
        if (mounted.current) setError(err);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
  }, [run]);

  return { data, loading, error, refetch: run, setData };
}
