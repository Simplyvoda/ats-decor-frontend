// A change counter per kind of server data. Services bump the counter after
// any write; list screens compare it on focus to decide whether what they
// are showing could be out of date (see useRefetchOnFocus). This is what
// lets a screen skip reloading when you come back to it and nothing changed.
export type DataKey = 'designs' | 'moodboard' | 'notes';

const versions: Record<DataKey, number> = {designs: 0, moodboard: 0, notes: 0};

export const bumpDataVersion = (...keys: DataKey[]) => {
  keys.forEach(key => {
    versions[key] += 1;
  });
};

export const getDataVersion = (keys: DataKey[]) =>
  keys.map(key => versions[key]).join(':');
