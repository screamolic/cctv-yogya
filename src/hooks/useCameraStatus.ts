import { useState, useEffect, useCallback, useRef } from 'react';
import { CCTVCamera, CameraLiveStatus } from '../types/cctv';

export function useCameraStatus(
  priorityCameras: CCTVCamera[] = [],
  autoRefreshIntervalMs: number = 30000
) {
  const [statuses, setStatuses] = useState<Record<string, CameraLiveStatus>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastGlobalCheck, setLastGlobalCheck] = useState<string>('');

  const probedIdsRef = useRef<Set<string>>(new Set());
  const checkingIdsRef = useRef<Set<string>>(new Set());
  const priorityCamerasRef = useRef<CCTVCamera[]>(priorityCameras);

  useEffect(() => {
    priorityCamerasRef.current = priorityCameras;
  }, [priorityCameras]);

  const checkSingleCamera = useCallback(async (camera: CCTVCamera): Promise<CameraLiveStatus> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const startTime = performance.now();

    try {
      const response = await fetch(camera.stream_url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          status: 'offline',
          latencyMs,
          errorReason: `HTTP ${response.status}: Sinyal kamera offline`,
          lastChecked: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
      }

      const text = await response.text();

      if (!text.includes('#EXTM3U')) {
        return {
          status: 'offline',
          latencyMs,
          errorReason: 'Format playlist tidak valid',
          lastChecked: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
      }

      const lines = text.split('\n');
      const segmentCount = lines.filter(
        (l) => l.trim().endsWith('.ts') || (!l.startsWith('#') && l.trim().length > 0)
      ).length;

      const targetMatch = text.match(/#EXT-X-TARGETDURATION:(\d+)/);
      const seqMatch = text.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/);

      return {
        status: segmentCount > 0 ? (latencyMs > 2500 ? 'degraded' : 'live') : 'degraded',
        latencyMs,
        segmentCount,
        targetDuration: targetMatch ? parseInt(targetMatch[1], 10) : undefined,
        mediaSequence: seqMatch ? parseInt(seqMatch[1], 10) : undefined,
        lastChecked: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);
      const isAbort = err instanceof Error && err.name === 'AbortError';

      return {
        status: 'offline',
        latencyMs,
        errorReason: isAbort ? 'Waktu habis (>5s)' : 'Kamera tidak merespon',
        lastChecked: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    }
  }, []);

  // Worker pool for concurrency control (up to 5 parallel requests)
  const probeBatch = useCallback(
    async (targets: CCTVCamera[]) => {
      // Filter out any cameras that are already actively checking
      const toCheck = targets.filter((c) => !checkingIdsRef.current.has(c.id));
      if (toCheck.length === 0) return;

      setIsRefreshing(true);
      toCheck.forEach((c) => checkingIdsRef.current.add(c.id));

      const queue = [...toCheck];
      const concurrency = 5;
      const batchResults: Record<string, CameraLiveStatus> = {};

      const worker = async () => {
        while (queue.length > 0) {
          const cam = queue.shift();
          if (!cam) break;
          const res = await checkSingleCamera(cam);
          checkingIdsRef.current.delete(cam.id);
          probedIdsRef.current.add(cam.id);
          batchResults[cam.id] = res;
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
      await Promise.all(workers);

      // Single batched state update to prevent cascading re-renders
      setStatuses((prev) => ({
        ...prev,
        ...batchResults,
      }));

      setIsRefreshing(false);
      setLastGlobalCheck(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    },
    [checkSingleCamera]
  );

  const refreshBatch = useCallback(
    async (targets: CCTVCamera[]) => {
      if (targets.length === 0) return;
      setIsRefreshing(true);

      // Immediately set their status to checking in state for instant UI feedback
      setStatuses((prev) => {
        const next = { ...prev };
        targets.forEach((c) => {
          next[c.id] = {
            ...(prev[c.id] || {}),
            status: 'checking',
          };
          probedIdsRef.current.delete(c.id);
          checkingIdsRef.current.delete(c.id);
        });
        return next;
      });

      await probeBatch(targets);
    },
    [probeBatch]
  );

  const refreshAll = useCallback(() => {
    refreshBatch(priorityCamerasRef.current);
  }, [refreshBatch]);

  const refreshSingle = useCallback(
    async (camera: CCTVCamera) => {
      checkingIdsRef.current.add(camera.id);
      setStatuses((prev) => ({
        ...prev,
        [camera.id]: {
          ...(prev[camera.id] || {}),
          status: 'checking',
        },
      }));
      const res = await checkSingleCamera(camera);
      checkingIdsRef.current.delete(camera.id);
      probedIdsRef.current.add(camera.id);
      setStatuses((prev) => ({
        ...prev,
        [camera.id]: res,
      }));
    },
    [checkSingleCamera]
  );

  // Auto check priority cameras on mount or when priority camera IDs change
  const priorityIdsKey = priorityCameras.map((c) => c.id).join(',');
  useEffect(() => {
    const unprobed = priorityCamerasRef.current.filter(
      (c) => !probedIdsRef.current.has(c.id) && !checkingIdsRef.current.has(c.id)
    );
    if (unprobed.length > 0) {
      probeBatch(unprobed);
    }
  }, [priorityIdsKey, probeBatch]);

  // Periodic polling for active/priority cameras
  useEffect(() => {
    if (autoRefreshIntervalMs <= 0) return;
    const interval = setInterval(() => {
      if (priorityCamerasRef.current.length > 0) {
        probeBatch(priorityCamerasRef.current);
      }
    }, autoRefreshIntervalMs);
    return () => clearInterval(interval);
  }, [autoRefreshIntervalMs, probeBatch]);

  // Derived counts
  const liveCount = Object.values(statuses).filter(
    (s) => s.status === 'live' || s.status === 'degraded'
  ).length;
  const offlineCount = Object.values(statuses).filter((s) => s.status === 'offline').length;
  const checkingCount = Object.values(statuses).filter((s) => s.status === 'checking').length;

  return {
    statuses,
    isRefreshing,
    lastGlobalCheck,
    refreshAll,
    refreshSingle,
    refreshBatch,
    probeBatch,
    liveCount,
    offlineCount,
    checkingCount,
  };
}
