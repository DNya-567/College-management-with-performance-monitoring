// Hook: provides active semester + semester list + selector state.
// Must NOT contain API definitions or UI markup.
import { useCallback, useEffect, useState } from "react";
import { fetchSemesters, fetchActiveSemester } from "../api/semesters.api";

export function useSemester() {
  const [semesters, setSemesters] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, activeRes] = await Promise.all([
        fetchSemesters(),
        fetchActiveSemester(),
      ]);
      const all = allRes.data?.semesters || [];
      const active = activeRes.data?.semester || null;

      setSemesters(all);
      setActiveSemester(active);

      // Default selection to active semester
      if (active && !selectedSemesterId) {
        setSelectedSemesterId(active.id);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []); // intentionally no selectedSemesterId dep — only set on first load

  useEffect(() => {
    load();
  }, [load]);

  return {
    semesters,
    activeSemester,
    selectedSemesterId,
    setSelectedSemesterId,
    loading,
    reload: load,
  };
}

