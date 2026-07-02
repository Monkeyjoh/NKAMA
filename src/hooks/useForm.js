import { useCallback, useState } from "react";

/**
 * NKAMA — Petit hook de gestion d'état de formulaire.
 * @param {Object} initial valeurs initiales
 */
export function useForm(initial = {}) {
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const setField = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
  }, []);

  const reset = useCallback((next = initial) => {
    setValues(next);
    setError(null);
    setSubmitting(false);
  }, [initial]);

  return { values, setField, setValues, reset, submitting, setSubmitting, error, setError };
}
