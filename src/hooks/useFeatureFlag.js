import { useState, useEffect } from 'react';
import { sb } from '../client.js';

const cache = {};

function hashUserId(userId) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (Math.imul(31, h) + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 100;
}

export function useFeatureFlag(flagName, userId = null) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (cache[flagName] !== undefined) {
      const flag = cache[flagName];
      setEnabled(resolveFlag(flag, userId));
      return;
    }

    sb.from('feature_flags')
      .select('enabled, rollout_percentage')
      .eq('flag_name', flagName)
      .single()
      .then(({ data }) => {
        if (data) {
          cache[flagName] = data;
          setEnabled(resolveFlag(data, userId));
        }
      });
  }, [flagName, userId]);

  return enabled;
}

function resolveFlag(flag, userId) {
  if (!flag.enabled) return false;
  if (flag.rollout_percentage >= 100) return true;
  if (!userId) return false;
  return hashUserId(userId) < flag.rollout_percentage;
}
